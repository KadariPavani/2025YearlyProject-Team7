const axios = require('axios');

// ─── Wandbox API (FREE, no auth required) ───
const WANDBOX_API_URL = 'https://wandbox.org/api';

const WANDBOX_COMPILER_MAP = {
  'javascript': 'nodejs-20.17.0',
  'js': 'nodejs-20.17.0',
  'node': 'nodejs-20.17.0',
  'python': 'cpython-3.12.7',
  'py': 'cpython-3.12.7',
  'java': 'openjdk-jdk-22+36',
  'c': 'gcc-13.2.0-c',
  'cpp': 'gcc-13.2.0',
  'c++': 'gcc-13.2.0'
};

// ─── Judge0 CE (RapidAPI, needs API key) ───
const JUDGE0_API_URL = process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com';
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY || '';
const USE_RAPIDAPI = process.env.JUDGE0_USE_RAPIDAPI === 'true' || JUDGE0_API_URL.includes('rapidapi.com');

const LANGUAGE_MAP = {
  'javascript': 63, 'js': 63, 'node': 63,
  'python': 71, 'py': 71,
  'java': 62,
  'c': 50,
  'cpp': 54, 'c++': 54
};

// Piston language map (kept for backward compat export)
const PISTON_LANGUAGE_MAP = {
  'javascript': { language: 'javascript', version: '18.15.0' },
  'js': { language: 'javascript', version: '18.15.0' },
  'node': { language: 'javascript', version: '18.15.0' },
  'python': { language: 'python', version: '3.10.0' },
  'py': { language: 'python', version: '3.10.0' },
  'java': { language: 'java', version: '15.0.2' },
  'c': { language: 'c', version: '10.2.0' },
  'cpp': { language: 'c++', version: '10.2.0' },
  'c++': { language: 'c++', version: '10.2.0' }
};

/**
 * Submit code to Wandbox API (free, no auth)
 */
async function submitToWandbox(code, language, stdin = '') {
  const compiler = WANDBOX_COMPILER_MAP[language];
  if (!compiler) {
    throw new Error(`Language ${language} not supported by Wandbox`);
  }

  // Java: Wandbox uses filename "prog.java", so remove 'public' from class declaration
  let processedCode = code;
  if (language === 'java') {
    processedCode = code.replace(/public\s+class\s+/g, 'class ');
  }

  const response = await axios.post(
    `${WANDBOX_API_URL}/compile.json`,
    {
      code: processedCode,
      compiler,
      stdin: stdin || '',
      'compiler-option-raw': language === 'cpp' || language === 'c++' ? '-std=c++17' : ''
    },
    { timeout: 30000, headers: { 'Content-Type': 'application/json' } }
  );

  return response.data;
}

/**
 * Submit code to Judge0 API (requires RapidAPI key)
 */
async function submitToJudge0(code, languageId, stdin = '', expectedOutput = '') {
  const headers = { 'content-type': 'application/json' };
  if (USE_RAPIDAPI && JUDGE0_API_KEY) {
    headers['X-RapidAPI-Key'] = JUDGE0_API_KEY;
    headers['X-RapidAPI-Host'] = 'judge0-ce.p.rapidapi.com';
  }

  const response = await axios.post(
    `${JUDGE0_API_URL}/submissions?base64_encoded=true&wait=true`,
    {
      source_code: Buffer.from(code).toString('base64'),
      language_id: languageId,
      stdin: Buffer.from(stdin).toString('base64'),
      expected_output: expectedOutput ? Buffer.from(expectedOutput).toString('base64') : undefined
    },
    { headers, timeout: 30000 }
  );

  return response.data;
}

/**
 * Run a single test case via Wandbox
 */
async function runTestCaseWandbox(code, normalizedLang, testCase) {
  const input = testCase.input || '';
  const expectedOutput = (testCase.expectedOutput || '').replace(/\r\n/g, '\n').trim();
  const startTime = Date.now();

  const testResult = {
    status: 'failed',
    executionTime: 0,
    memoryUsed: 0,
    output: '',
    error: '',
    marksAwarded: 0,
    maxMarks: testCase.marks || 0,
    isHidden: !!testCase.isHidden
  };

  const result = await submitToWandbox(code, normalizedLang, input);
  testResult.executionTime = Date.now() - startTime;

  // Check for compilation errors
  const compilerError = (result.compiler_error || '').trim();
  if (result.status === '1' && compilerError && !result.program_output) {
    return { testResult, compilationError: compilerError };
  }

  // Check for signal (timeout / killed)
  if (result.signal && result.signal !== '') {
    if (result.signal === 'SIGKILL' || result.signal === 'SIGXCPU') {
      testResult.status = 'time_limit_exceeded';
      testResult.error = 'Time limit exceeded';
    } else {
      testResult.status = 'runtime_error';
      testResult.error = result.program_error || `Signal: ${result.signal}`;
    }
    return { testResult, compilationError: '' };
  }

  // Check for runtime errors (non-zero exit)
  if (result.status !== '0') {
    testResult.status = 'runtime_error';
    testResult.error = (result.program_error || result.program_message || 'Runtime error').trim();
    return { testResult, compilationError: '' };
  }

  // Compare output
  const output = (result.program_output || '').replace(/\r\n/g, '\n').trim();
  testResult.output = output;
  if (output === expectedOutput) {
    testResult.status = 'passed';
    testResult.marksAwarded = testCase.marks || 0;
  } else {
    testResult.status = 'failed';
  }

  return { testResult, compilationError: '' };
}

/**
 * Run a single test case via Judge0
 */
async function runTestCaseJudge0(code, normalizedLang, testCase) {
  const input = testCase.input || '';
  const expectedOutput = (testCase.expectedOutput || '').replace(/\r\n/g, '\n').trim();

  const testResult = {
    status: 'failed',
    executionTime: 0,
    memoryUsed: 0,
    output: '',
    error: '',
    marksAwarded: 0,
    maxMarks: testCase.marks || 0,
    isHidden: !!testCase.isHidden
  };

  const languageId = LANGUAGE_MAP[normalizedLang];
  const result = await submitToJudge0(code, languageId, input, expectedOutput);

  testResult.executionTime = parseFloat(result.time || 0) * 1000;
  testResult.memoryUsed = parseInt(result.memory || 0);

  const stdout = result.stdout ? Buffer.from(result.stdout, 'base64').toString('utf8') : '';
  const stderr = result.stderr ? Buffer.from(result.stderr, 'base64').toString('utf8') : '';
  const compile_output = result.compile_output ? Buffer.from(result.compile_output, 'base64').toString('utf8') : '';

  const statusId = result.status.id;

  if (statusId === 6) {
    return { testResult, compilationError: compile_output || stderr || 'Compilation failed' };
  } else if (statusId === 3) {
    testResult.status = 'passed';
    testResult.output = stdout.trim();
    testResult.marksAwarded = testCase.marks || 0;
  } else if (statusId === 5) {
    testResult.status = 'time_limit_exceeded';
    testResult.error = 'Time limit exceeded';
  } else if (statusId === 11 || statusId === 12) {
    testResult.status = 'runtime_error';
    testResult.error = stderr || 'Runtime error';
  } else if (statusId === 4) {
    testResult.status = 'failed';
    testResult.output = stdout.trim();
  } else {
    testResult.status = 'runtime_error';
    testResult.error = result.status.description || 'Execution error';
  }

  return { testResult, compilationError: '' };
}

/**
 * Run submission using external API
 * Priority: Wandbox (free) → Judge0 (if API key set) → error
 */
async function runSubmissionExternal({ language, code, testCases = [], timeLimit = 2000, memoryLimit = 256000 }) {
  const startOverall = Date.now();
  const normalizedLang = language.toLowerCase();

  // Build API priority list: Wandbox first (free), Judge0 as fallback if key exists
  const apis = [];
  if (WANDBOX_COMPILER_MAP[normalizedLang]) apis.push('wandbox');
  if (JUDGE0_API_KEY && LANGUAGE_MAP[normalizedLang]) apis.push('judge0');

  if (apis.length === 0) {
    return {
      compilationError: `Language ${language} is not supported by the external judge`,
      testCaseResults: [],
      totalTime: Date.now() - startOverall
    };
  }


  for (const api of apis) {
    const results = [];
    let apiFailed = false;

    for (const testCase of testCases) {
      try {
        const { testResult, compilationError } = api === 'wandbox'
          ? await runTestCaseWandbox(code, normalizedLang, testCase)
          : await runTestCaseJudge0(code, normalizedLang, testCase);

        if (compilationError) {
          return { compilationError, testCaseResults: [], totalTime: Date.now() - startOverall };
        }
        results.push(testResult);
      } catch (error) {
        const status = error.response?.status;

        // If server error or auth error, try fallback API
        if ((status === 401 || status === 403 || status === 500 || status === 502 || status === 503) && api !== apis[apis.length - 1]) {
          apiFailed = true;
          break;
        }

        results.push({
          status: 'runtime_error',
          executionTime: 0,
          memoryUsed: 0,
          output: '',
          error: `External judge error: ${error.message}`,
          marksAwarded: 0,
          maxMarks: testCase.marks || 0,
          isHidden: !!testCase.isHidden
        });
      }
    }

    if (!apiFailed) {
      return { compilationError: '', testCaseResults: results, totalTime: Date.now() - startOverall };
    }
  }

  return {
    compilationError: 'All code execution APIs are currently unavailable. Please try again later.',
    testCaseResults: [],
    totalTime: Date.now() - startOverall
  };
}

module.exports = {
  runSubmissionExternal,
  PISTON_LANGUAGE_MAP,
  LANGUAGE_MAP
};
