const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const TEMP_DIR = path.join(__dirname, '..', 'temp');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

// Helper to write temp file and return path
function writeTempFile(prefix, ext, content) {
  const id = crypto.randomBytes(8).toString('hex');
  const filename = `${prefix}_${id}.${ext}`;
  const filepath = path.join(TEMP_DIR, filename);
  fs.writeFileSync(filepath, content, { encoding: 'utf8' });
  return { filepath, filename };
}

// Safe exec with timeout
function execWithTimeout(cmd, options = {}, timeoutMs = 2000) {
  return new Promise((resolve) => {
    const proc = exec(cmd, { ...options, timeout: timeoutMs, maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        if (error.killed && error.signal === 'SIGTERM') {
          return resolve({ timedOut: true, stdout: stdout || '', stderr: stderr || '', code: null });
        }
        return resolve({ error, stdout: stdout || '', stderr: stderr || '', code: error.code });
      }
      resolve({ stdout: stdout || '', stderr: stderr || '', code: 0 });
    });

    // in case spawn/exec doesn't cover timeout we still track
    setTimeout(() => {
      try { proc.kill('SIGTERM'); } catch (e) {}
    }, timeoutMs + 100);
  });
}

// Normalize outputs for comparison
function normalizeOutput(s) {
  return (s || '').replace(/\r\n/g, '\n').trim();
}

async function runSubmission({ language, code, testCases = [], timeLimit = 2000, memoryLimit = 256000 }) {
  // timeLimit in ms
  // memoryLimit in KB (not enforced here, just metadata)
  const results = [];
  const startOverall = Date.now();
  let compilationError = '';
  let compileSuccess = true;
  let binPath = null;
  let srcInfo = null;

  try {
    if (['python', 'py'].includes(language)) {
      srcInfo = writeTempFile('submission', 'py', code);
      // Prefer python3, fall back to python (Windows). Also verify interpreter is available and try a fallback if needed.
      let pythonCmd = 'python3';
      try {
        const check = await execWithTimeout(`${pythonCmd} --version`, {}, 1000);
        if (check.code !== 0 || /not recognized|not found/i.test((check.stderr || '') + (check.stdout || ''))) {
          pythonCmd = 'python';
        }
      } catch (e) {
        pythonCmd = 'python';
      }
      binPath = `${pythonCmd} ${srcInfo.filepath}`;

      // double-check interpreter availability; try to switch if first choice fails at runtime
      try {
        const verify = await execWithTimeout(`${pythonCmd} --version`, {}, 1000);
        if (verify.code !== 0 || /not recognized|not found/i.test((verify.stderr || '') + (verify.stdout || ''))) {
          // try alternative
          const alt = pythonCmd === 'python3' ? 'python' : 'python3';
          const altCheck = await execWithTimeout(`${alt} --version`, {}, 1000);
          if (altCheck.code === 0) {
            pythonCmd = alt;
            binPath = `${pythonCmd} ${srcInfo.filepath}`;
          }
        }
      } catch (e) {
        // ignore and proceed; runtime will surface the error
      }
    } else if (['javascript', 'js', 'node'].includes(language)) {
      srcInfo = writeTempFile('submission', 'js', code);
      binPath = `node ${srcInfo.filepath}`;
    } else if (['c'].includes(language)) {
      // compile with gcc
      srcInfo = writeTempFile('submission', 'c', code);
      const outExe = path.join(TEMP_DIR, `${path.basename(srcInfo.filename, '.c')}.out`);
      const compile = await execWithTimeout(`gcc "${srcInfo.filepath}" -O2 -o "${outExe}"`, {}, 10000);
      if (compile.code !== 0) {
        compilationError = compile.stderr || 'Compilation failed';
        compileSuccess = false;
      } else {
        binPath = `"${outExe}"`;
      }
    } else if (['cpp', 'c++'].includes(language) || language === 'cpp') {
      srcInfo = writeTempFile('submission', 'cpp', code);
      const outExe = path.join(TEMP_DIR, `${path.basename(srcInfo.filename, '.cpp')}.out`);
      const compile = await execWithTimeout(`g++ "${srcInfo.filepath}" -O2 -std=c++17 -o "${outExe}"`, {}, 10000);
      if (compile.code !== 0) {
        compilationError = compile.stderr || 'Compilation failed';
        compileSuccess = false;
      } else {
        binPath = `"${outExe}"`;
      }
    } else if (['java'].includes(language)) {
      // naive java compile
      // user must put public class name correctly; we will write file as Main.java
      srcInfo = writeTempFile('submission', 'java', code);
      const workDir = path.dirname(srcInfo.filepath);
      const compile = await execWithTimeout(`javac "${srcInfo.filepath}"`, { cwd: workDir }, 10000);
      if (compile.code !== 0) {
        compilationError = compile.stderr || 'Compilation failed';
        compileSuccess = false;
      } else {
        // assume class has Main
        binPath = `java -cp "${workDir}" Main`;
      }
    } else {
      compileSuccess = false;
      compilationError = `Language ${language} is not supported on this judge.`;
    }

    if (!compileSuccess) {
      return { compilationError, testCaseResults: [], totalTime: Date.now() - startOverall };
    }

    // Log which binary/interpreter we'll invoke (helpful when 'python3' missing on Windows)
    try {
      const _bin = (binPath || '').split(' ')[0];
      console.log(`[judge] Executing with: ${_bin}`);
    } catch (e) {}

    // run per test case
    for (const t of testCases) {
      const input = t.input || '';
      const expected = t.expectedOutput || '';
      const testResult = {
        status: 'failed',
        executionTime: 0,
        memoryUsed: 0,
        output: '',
        error: '',
        marksAwarded: 0,
        maxMarks: t.marks || 0,
        isHidden: !!t.isHidden
      };

      const start = Date.now();
      try {
        // spawn process with input
        const execCmd = binPath;
        const execOptions = { timeout: Math.max(1000, timeLimit + 500), maxBuffer: 1024 * 1024 * 10 };
        const res = await new Promise((resolve) => {
          const proc = exec(execCmd, execOptions, (error, stdout, stderr) => {
            if (error) return resolve({ error, stdout: stdout || '', stderr: stderr || '', killed: error.killed, signal: error.signal, code: error.code });
            resolve({ stdout: stdout || '', stderr: stderr || '', code: 0 });
          });
          // write to stdin
          if (proc.stdin) {
            try { proc.stdin.write(input); } catch (e) {}
            try { proc.stdin.end(); } catch (e) {}
          }
        });

        const elapsed = Date.now() - start;
        testResult.executionTime = elapsed;
        testResult.output = normalizeOutput(res.stdout || '');
        if (res.timedOut || res.killed) {
          testResult.status = 'time_limit_exceeded';
          testResult.error = 'Time limit exceeded';
        } else if (res.code !== 0) {
          // Detect interpreter-missing errors and retry with a Python fallback if applicable
          const combinedErr = (res.stderr || '') + (res.stdout || '');
          if (/not recognized|not found|command not found/i.test(combinedErr) && /python3/.test(binPath)) {
            const altBin = binPath.replace('python3', 'python');
            console.log(`[judge] Interpreter ${binPath.split(' ')[0]} not found; retrying with ${altBin.split(' ')[0]}`);
            // rerun this test with the alternative interpreter
            const rerunRes = await new Promise((resolve) => {
              const proc2 = exec(altBin, execOptions, (error2, stdout2, stderr2) => {
                if (error2) return resolve({ error: error2, stdout: stdout2 || '', stderr: stderr2 || '', killed: error2.killed, signal: error2.signal, code: error2.code });
                resolve({ stdout: stdout2 || '', stderr: stderr2 || '', code: 0 });
              });
              if (proc2.stdin) {
                try { proc2.stdin.write(input); } catch (e) {}
                try { proc2.stdin.end(); } catch (e) {}
              }
            });

            if (rerunRes.timedOut || rerunRes.killed) {
              testResult.status = 'time_limit_exceeded';
              testResult.error = 'Time limit exceeded';
            } else if (rerunRes.code !== 0) {
              testResult.status = 'runtime_error';
              testResult.error = rerunRes.stderr || 'Runtime error';
            } else {
              testResult.output = normalizeOutput(rerunRes.stdout || '');
              if (normalizeOutput(expected) === testResult.output) {
                testResult.status = 'passed';
                testResult.marksAwarded = t.marks || 0;
                // update binPath so subsequent tests use working interpreter
                binPath = altBin;
              } else {
                testResult.status = 'failed';
              }
            }
          } else {
            testResult.status = 'runtime_error';
            testResult.error = res.stderr || 'Runtime error';
          }
        } else {
          // compare outputs
          if (normalizeOutput(expected) === testResult.output) {
            testResult.status = 'passed';
            testResult.marksAwarded = t.marks || 0;
          } else {
            testResult.status = 'failed';
            // Optionally we can award partial credit later
          }
        }
      } catch (error) {
        testResult.status = 'runtime_error';
        testResult.error = error.message;
      }

      results.push(testResult);
    }

    return { compilationError: compilationError || '', testCaseResults: results, totalTime: Date.now() - startOverall };
  } finally {
    // Clean up some files (best effort)
    try {
      if (srcInfo && fs.existsSync(srcInfo.filepath)) fs.unlinkSync(srcInfo.filepath);
    } catch (e) {}
    // Note: compiled binaries may remain for a short while; consider periodic cleanup
  }
}

module.exports = { runSubmission };
