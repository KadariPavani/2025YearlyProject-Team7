const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Import external judge API for serverless environments
const { runSubmissionExternal } = require('./judge0Api');

// CRITICAL: Use /tmp for Vercel serverless environment
// Vercel provides writable /tmp directory for serverless functions
const TEMP_DIR = process.env.VERCEL === '1' 
  ? '/tmp' 
  : path.join(__dirname, '..', 'temp');

// Detect if we're in a serverless/deployment environment without compilers
// Force external API usage when deployed (Vercel, Netlify, etc.)
const USE_EXTERNAL_JUDGE = process.env.VERCEL === '1' || 
                          process.env.USE_EXTERNAL_JUDGE === 'true' ||
                          process.env.NODE_ENV === 'production';

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  try {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
    console.log(`✅ Created temp directory: ${TEMP_DIR}`);
  } catch (err) {
    console.error(`❌ Failed to create temp directory: ${err.message}`);
  }
}

// Helper to write temp file and return path
function writeTempFile(prefix, ext, content) {
  const id = crypto.randomBytes(4).toString('hex'); // Shorter ID for filename length
  const filename = `${prefix}_${id}.${ext}`;
  const filepath = path.join(TEMP_DIR, filename);
  
  try {
    fs.writeFileSync(filepath, content, { encoding: 'utf8' });
    console.log(`📝 Created temp file: ${filename}`);
    return { filepath, filename };
  } catch (error) {
    console.error(`❌ Failed to write temp file: ${error.message}`);
    throw new Error(`Failed to create temp file: ${error.message}`);
  }
}

// Cleanup function to remove old temp files (prevent /tmp from filling up)
function cleanupTempFiles() {
  try {
    const files = fs.readdirSync(TEMP_DIR);
    const now = Date.now();
    const MAX_AGE = 5 * 60 * 1000; // 5 minutes
    
    let cleanedCount = 0;
    files.forEach(file => {
      try {
        const filepath = path.join(TEMP_DIR, file);
        const stats = fs.statSync(filepath);
        
        // Delete files older than MAX_AGE
        if (now - stats.mtimeMs > MAX_AGE) {
          fs.unlinkSync(filepath);
          cleanedCount++;
        }
      } catch (err) {
        // Ignore errors for individual files
      }
    });
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} old temp files`);
    }
  } catch (error) {
    console.error(`⚠️ Temp cleanup error: ${error.message}`);
  }
}

// Run cleanup periodically (only in non-serverless or on startup)
if (process.env.VERCEL !== '1') {
  setInterval(cleanupTempFiles, 5 * 60 * 1000); // Every 5 minutes
} else {
  // Clean up on each serverless invocation
  cleanupTempFiles();
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
  // Check if we should use external judge (for deployment environments)
  if (USE_EXTERNAL_JUDGE) {
    console.log('[judge] 🌐 Using external API (deployment mode) for language:', language);
    try {
      return await runSubmissionExternal({ language, code, testCases, timeLimit, memoryLimit });
    } catch (error) {
      console.error('[judge] ❌ External API failed:', error.message);
      // For JavaScript, we can still fall back to local execution
      if (['javascript', 'js', 'node'].includes(language)) {
        console.log('[judge] ⚠️ Falling back to local Node.js execution for JavaScript');
        // Continue with local execution below
      } else {
        return {
          compilationError: `External judge API failed: ${error.message}. Please try again or contact support.`,
          testCaseResults: [],
          totalTime: 0
        };
      }
    }
  }

  // LOCAL EXECUTION (for localhost/development)
  console.log('[judge] 💻 Using local compilers (development mode) for language:', language);
  
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
        const stderrCombined = (compile.stderr || '') + (compile.stdout || '');
        if (/not recognized|not found|command not found/i.test(stderrCombined)) {
          compilationError = 'gcc not found. Please install GCC (e.g. MinGW/MSYS2 on Windows or build-essential on Linux) and ensure it is on your PATH.';
        } else {
          compilationError = compile.stderr || 'Compilation failed';
        }
        compileSuccess = false;
      } else {
        binPath = `"${outExe}"`;
      }
    } else if (['cpp', 'c++'].includes(language) || language === 'cpp') {
      srcInfo = writeTempFile('submission', 'cpp', code);
      const outExe = path.join(TEMP_DIR, `${path.basename(srcInfo.filename, '.cpp')}.out`);
      const compile = await execWithTimeout(`g++ "${srcInfo.filepath}" -O2 -std=c++17 -o "${outExe}"`, {}, 10000);
      if (compile.code !== 0) {
        const stderrCombined = (compile.stderr || '') + (compile.stdout || '');
        if (/not recognized|not found|command not found/i.test(stderrCombined)) {
          compilationError = 'g++ not found. Please install GCC (g++) (e.g. MinGW/MSYS2 on Windows or g++/build-essential on Linux) and ensure it is on your PATH.';
        } else {
          compilationError = compile.stderr || 'Compilation failed';
        }
        compileSuccess = false;
      } else {
        binPath = `"${outExe}"`;
      }
    } else if (['java'].includes(language)) {
      // improved java handling
      // sanitize common placeholders (e.g. "# Your code here") and shebangs which are invalid in Java
      let sanitizedCode = code;
      if (typeof sanitizedCode === 'string') {
        const lines = sanitizedCode.split(/\r?\n/);
        let changed = false;
        for (let i = 0; i < Math.min(lines.length, 5); i++) {
          if (/^\s*#/.test(lines[i])) {
            lines[i] = lines[i].replace(/^\s*#/, '//');
            changed = true;
          }
        }
        if (changed) {
          sanitizedCode = lines.join('\n');
          console.log('[judge][java] sanitized leading # lines into // comments to avoid syntax errors');
        }
      }

      // detect public class name and write file with correct filename to avoid "class X is public, should be declared in a file named X.java" errors
      srcInfo = writeTempFile('submission', 'java', sanitizedCode);
      // make sure subsequent steps operate on the sanitized source
      code = sanitizedCode;

      // try to detect a public class name
      let classMatch = (code || '').match(/public\s+class\s+([A-Za-z_][A-Za-z0-9_]*)/);
      let className = classMatch ? classMatch[1] : null;
      if (!className) {
        // fall back to plain class if public not used
        classMatch = (code || '').match(/class\s+([A-Za-z_][A-Za-z0-9_]*)/);
        className = classMatch ? classMatch[1] : null;
      }

      if (className) {
        // write file as <ClassName>.java so javac accepts it
        try {
          const newFilename = `${className}.java`;
          const newFilepath = path.join(TEMP_DIR, newFilename);
          fs.writeFileSync(newFilepath, code, { encoding: 'utf8' });
          // remove original temp file
          try { fs.unlinkSync(srcInfo.filepath); } catch (e) {}
          srcInfo = { filepath: newFilepath, filename: newFilename };
        } catch (e) {
          // ignore and use original
        }
      }

      const workDir = path.dirname(srcInfo.filepath);

      // detect java / javac versions to avoid UnsupportedClassVersionError where javac and java point
      // to different installations (e.g. javac newer than java runtime)
      const javaVerRes = await execWithTimeout('java -version', {}, 2000);
      const javacVerRes = await execWithTimeout('javac -version', {}, 2000);
      const javaVerOut = ((javaVerRes.stderr || '') + (javaVerRes.stdout || '')).trim();
      const javacVerOut = ((javacVerRes.stderr || '') + (javacVerRes.stdout || '')).trim();

      function parseMajorVersion(str) {
        // matches "1.8.0_..." or "17.0.1" or "21" etc.
        const m = str.match(/version\s+"([0-9_\.]+)"/i) || str.match(/javac\s+([0-9_\.]+)/i);
        const v = m && m[1] ? m[1] : (str.split(/\s+/)[1] || '');
        if (!v) return null;
        const parts = v.split(/[._]/);
        if (parts[0] === '1' && parts[1]) return parseInt(parts[1], 10);
        return parseInt(parts[0], 10);
      }

      const javaMajor = parseMajorVersion(javaVerOut);
      const javacMajor = parseMajorVersion(javacVerOut);

      try {
        // attempt to compile targeting the runtime's major version when possible
        let compile = null;
        let tried = [];

        if (javaMajor && javacMajor && javacMajor >= javaMajor) {
          tried.push(`javac --release ${javaMajor} "${srcInfo.filepath}"`);
          compile = await execWithTimeout(`javac --release ${javaMajor} "${srcInfo.filepath}"`, { cwd: workDir }, 10000);
        }

        // fallback: try -source/-target (older javac) if previous failed
        if (!compile || compile.code !== 0) {
          if (javaMajor && javacMajor && javacMajor >= javaMajor) {
            tried.push(`javac -source ${javaMajor} -target ${javaMajor} "${srcInfo.filepath}"`);
            compile = await execWithTimeout(`javac -source ${javaMajor} -target ${javaMajor} "${srcInfo.filepath}"`, { cwd: workDir }, 10000);
          }
        }

        // final fallback: plain javac
        if (!compile || compile.code !== 0) {
          tried.push(`javac "${srcInfo.filepath}"`);
          compile = await execWithTimeout(`javac "${srcInfo.filepath}"`, { cwd: workDir }, 10000);
        }

        if (compile.code !== 0) {
          const stderrCombined = (compile.stderr || '') + (compile.stdout || '');
          if (/not recognized|not found|command not found/i.test(stderrCombined)) {
            compilationError = 'javac (JDK) not found. Please install the Java Development Kit and ensure `javac`/`java` are on your PATH.';
          } else if (/error:\s+invalid\s+target\s+release/i.test(stderrCombined) || /unrecognized option: --release/i.test(stderrCombined)) {
            compilationError = `javac failed to compile for the runtime version. Tried: ${tried.join(' || ')}. Consider installing a matching JDK or using a compatible language level.`;
          } else if (/class .* is public, should be declared in a file named/i.test(stderrCombined) && !className) {
            compilationError = 'Public class name mismatch: Java requires the public class to be in a file with the same name. Ensure your public class name matches the filename or remove the public modifier.';
          } else {
            compilationError = compile.stderr || 'Compilation failed';
          }
          compileSuccess = false;
        } else {
          // run detected class or fall back to Main
          const runClass = className || 'Main';
          binPath = `java -cp "${workDir}" ${runClass}`;
          // log detected versions to aid debugging
          try { console.log(`[judge][java] javaVersion="${javaVerOut.split('\n')[0] || ''}" javacVersion="${javacVerOut.split('\n')[0] || ''}"`); } catch (e) {}
        }
      } catch (e) {
        compilationError = e.message || 'Compilation error';
        compileSuccess = false;
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
          const combinedErr = (res.stderr || '') + (res.stdout || '');

          // If Java runtime complains about UnsupportedClassVersionError, try to recompile targeting the runtime version and re-run
          if (/UnsupportedClassVersionError/i.test(combinedErr) && srcInfo && srcInfo.filepath) {
            try {
              const targetRelease = (typeof javaMajor === 'number' && javaMajor > 0) ? javaMajor : 8;
              console.log(`[judge] UnsupportedClassVersionError detected; attempting to recompile with --release ${targetRelease}`);
              const recompile = await execWithTimeout(`javac --release ${targetRelease} "${srcInfo.filepath}"`, { cwd: path.dirname(srcInfo.filepath) }, 10000);
              if (recompile.code === 0) {
                // rerun this test
                const rerunRes = await new Promise((resolve) => {
                  const proc2 = exec(execCmd, execOptions, (error2, stdout2, stderr2) => {
                    if (error2) return resolve({ error: error2, stdout: stdout2 || '', stderr: stderr2 || '', killed: error2.killed, signal: error2.signal, code: error2.code });
                    resolve({ stdout: stdout2 || '', stderr: stderr2 || '', code: 0 });
                  });
                  if (proc2.stdin) {
                    try { proc2.stdin.write(input); } catch (e) {}
                    try { proc2.stdin.end(); } catch (e) {}
                  }
                });

                testResult.output = normalizeOutput(rerunRes.stdout || '');
                if (rerunRes.timedOut || rerunRes.killed) {
                  testResult.status = 'time_limit_exceeded';
                  testResult.error = 'Time limit exceeded';
                } else if (rerunRes.code !== 0) {
                  testResult.status = 'runtime_error';
                  testResult.error = (rerunRes.stderr || rerunRes.stdout || 'Runtime error after recompilation');
                } else {
                  if (normalizeOutput(expected) === testResult.output) {
                    testResult.status = 'passed';
                    testResult.marksAwarded = t.marks || 0;
                  } else {
                    testResult.status = 'failed';
                  }
                }

                results.push(testResult);
                continue; // go to next test case
              } else {
                const reErr = (recompile.stderr || '') + (recompile.stdout || '');
                console.log(`[judge] Recompile with --release ${targetRelease} failed: ${reErr.split('\n')[0] || reErr}`);
              }
            } catch (e) {
              // ignore and fall through to normal error handling
            }
          }

          // Detect interpreter-missing errors and retry with a Python fallback if applicable
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
    // CRITICAL: Clean up temp files immediately in serverless environment
    // This prevents /tmp from filling up across invocations
    try {
      if (srcInfo && fs.existsSync(srcInfo.filepath)) {
        fs.unlinkSync(srcInfo.filepath);
        console.log(`🗑️ Cleaned up source file: ${srcInfo.filename}`);
      }
    } catch (e) {
      console.error(`⚠️ Failed to cleanup source file: ${e.message}`);
    }
    
    // Clean up compiled binaries
    try {
      if (binPath) {
        // Extract binary path from command (e.g., "gcc output.out" -> output.out)
        const binMatch = binPath.match(/"([^"]+\.out)"/);
        if (binMatch && binMatch[1]) {
          const binFile = binMatch[1];
          if (fs.existsSync(binFile)) {
            fs.unlinkSync(binFile);
            console.log(`🗑️ Cleaned up binary: ${path.basename(binFile)}`);
          }
        }
      }
    } catch (e) {
      console.error(`⚠️ Failed to cleanup binary: ${e.message}`);
    }
    
    // Clean up Java class files
    try {
      if (srcInfo && srcInfo.filename && srcInfo.filename.endsWith('.java')) {
        const classFile = srcInfo.filepath.replace('.java', '.class');
        if (fs.existsSync(classFile)) {
          fs.unlinkSync(classFile);
          console.log(`🗑️ Cleaned up class file: ${path.basename(classFile)}`);
        }
      }
    } catch (e) {
      console.error(`⚠️ Failed to cleanup class file: ${e.message}`);
    }
  }
}

module.exports = { runSubmission };
