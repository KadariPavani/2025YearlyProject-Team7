const axios = require('axios');

// Judge0 Language IDs mapping
const LANGUAGE_MAP = {
  'javascript': 63,  // Node.js (14.15.4)
  'js': 63,
  'node': 63,
  'python': 71,      // Python (3.8.1)
  'py': 71,
  'java': 62,        // Java (OpenJDK 13.0.1)
  'c': 50,           // C (GCC 9.2.0)
  'cpp': 54,         // C++ (GCC 9.2.0)
  'c++': 54
};

// Judge0 CE (Free) API Base URL - You can also use RapidAPI endpoint
// Option 1: Use Judge0 CE (self-hosted or free instance)
const JUDGE0_API_URL = process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com';
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY || ''; // RapidAPI key if using RapidAPI
const USE_RAPIDAPI = process.env.JUDGE0_USE_RAPIDAPI === 'true';

// Alternative: Piston API (free, no API key required)
const PISTON_API_URL = 'https://emkc.org/api/v2/piston';

// Language mapping for Piston
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
 * Submit code to Judge0 API
 */
async function submitToJudge0(code, languageId, stdin = '', expectedOutput = '') {
  try {
    const headers = USE_RAPIDAPI 
      ? {
          'content-type': 'application/json',
          'X-RapidAPI-Key': JUDGE0_API_KEY,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        }
      : {
          'content-type': 'application/json'
        };

    const submissionData = {
      source_code: Buffer.from(code).toString('base64'),
      language_id: languageId,
      stdin: Buffer.from(stdin).toString('base64'),
      expected_output: expectedOutput ? Buffer.from(expectedOutput).toString('base64') : undefined
    };

    const response = await axios.post(
      `${JUDGE0_API_URL}/submissions?base64_encoded=true&wait=true`,
      submissionData,
      { headers, timeout: 30000 }
    );

    return response.data;
  } catch (error) {
    console.error('[Judge0] Submission error:', error.message);
    throw error;
  }
}

/**
 * Submit code to Piston API (free alternative, no API key needed)
 */
async function submitToPiston(code, language, stdin = '') {
  try {
    const langInfo = PISTON_LANGUAGE_MAP[language];
    if (!langInfo) {
      throw new Error(`Language ${language} not supported by Piston`);
    }

    const response = await axios.post(
      `${PISTON_API_URL}/execute`,
      {
        language: langInfo.language,
        version: langInfo.version,
        files: [{
          name: `main.${language === 'python' || language === 'py' ? 'py' : language === 'java' ? 'java' : language === 'cpp' || language === 'c++' ? 'cpp' : language === 'c' ? 'c' : 'js'}`,
          content: code
        }],
        stdin: stdin,
        compile_timeout: 10000,
        run_timeout: 3000,
        compile_memory_limit: -1,
        run_memory_limit: -1
      },
      { timeout: 30000 }
    );

    return response.data;
  } catch (error) {
    console.error('[Piston] Submission error:', error.message);
    throw error;
  }
}

/**
 * Run submission using external API (Judge0 or Piston)
 * This is used when deployed to serverless environments without compilers
 */
async function runSubmissionExternal({ language, code, testCases = [], timeLimit = 2000, memoryLimit = 256000 }) {
  const startOverall = Date.now();
  const results = [];
  let compilationError = '';
  
  // Normalize language name
  const normalizedLang = language.toLowerCase();
  
  // Determine which API to use
  const usePiston = !JUDGE0_API_KEY || process.env.JUDGE_API_PROVIDER === 'piston';
  
  console.log(`[ExternalJudge] Using ${usePiston ? 'Piston' : 'Judge0'} API for language: ${normalizedLang}`);

  // Check if language is supported
  if (usePiston && !PISTON_LANGUAGE_MAP[normalizedLang]) {
    return {
      compilationError: `Language ${language} is not supported by the external judge (Piston)`,
      testCaseResults: [],
      totalTime: Date.now() - startOverall
    };
  } else if (!usePiston && !LANGUAGE_MAP[normalizedLang]) {
    return {
      compilationError: `Language ${language} is not supported by the external judge (Judge0)`,
      testCaseResults: [],
      totalTime: Date.now() - startOverall
    };
  }

  // Run each test case
  for (const testCase of testCases) {
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

    try {
      const startTime = Date.now();
      let result;

      if (usePiston) {
        // Use Piston API
        result = await submitToPiston(code, normalizedLang, input);
        
        const executionTime = Date.now() - startTime;
        testResult.executionTime = executionTime;

        // Check for compilation errors
        if (result.compile && result.compile.code !== 0) {
          compilationError = result.compile.stderr || result.compile.output || 'Compilation failed';
          return {
            compilationError,
            testCaseResults: [],
            totalTime: Date.now() - startOverall
          };
        }

        // Check for runtime errors
        if (result.run && result.run.code !== 0) {
          testResult.status = 'runtime_error';
          testResult.error = result.run.stderr || result.run.output || 'Runtime error';
        } else {
          const output = (result.run.output || '').replace(/\r\n/g, '\n').trim();
          testResult.output = output;

          // Compare outputs
          if (output === expectedOutput) {
            testResult.status = 'passed';
            testResult.marksAwarded = testCase.marks || 0;
          } else {
            testResult.status = 'failed';
          }
        }

        // Check for timeout (Piston doesn't explicitly return timeout status)
        if (result.run && result.run.signal === 'SIGKILL') {
          testResult.status = 'time_limit_exceeded';
          testResult.error = 'Time limit exceeded';
        }

      } else {
        // Use Judge0 API
        const languageId = LANGUAGE_MAP[normalizedLang];
        result = await submitToJudge0(code, languageId, input, expectedOutput);
        
        testResult.executionTime = parseFloat(result.time || 0) * 1000; // Convert to ms
        testResult.memoryUsed = parseInt(result.memory || 0);

        // Decode base64 outputs if present
        const stdout = result.stdout ? Buffer.from(result.stdout, 'base64').toString('utf8') : '';
        const stderr = result.stderr ? Buffer.from(result.stderr, 'base64').toString('utf8') : '';
        const compile_output = result.compile_output ? Buffer.from(result.compile_output, 'base64').toString('utf8') : '';

        // Check status
        const statusId = result.status.id;

        if (statusId === 6) {
          // Compilation Error
          compilationError = compile_output || stderr || 'Compilation failed';
          return {
            compilationError,
            testCaseResults: [],
            totalTime: Date.now() - startOverall
          };
        } else if (statusId === 3) {
          // Accepted
          testResult.status = 'passed';
          testResult.output = stdout.trim();
          testResult.marksAwarded = testCase.marks || 0;
        } else if (statusId === 5) {
          // Time Limit Exceeded
          testResult.status = 'time_limit_exceeded';
          testResult.error = 'Time limit exceeded';
        } else if (statusId === 11 || statusId === 12) {
          // Runtime Error
          testResult.status = 'runtime_error';
          testResult.error = stderr || 'Runtime error';
        } else if (statusId === 4) {
          // Wrong Answer
          testResult.status = 'failed';
          testResult.output = stdout.trim();
        } else {
          // Other statuses (internal error, etc.)
          testResult.status = 'runtime_error';
          testResult.error = result.status.description || 'Execution error';
        }
      }

    } catch (error) {
      console.error('[ExternalJudge] Error:', error.message);
      testResult.status = 'runtime_error';
      testResult.error = `External judge error: ${error.message}`;
    }

    results.push(testResult);
    
    // If compilation error occurred, stop processing further test cases
    if (compilationError) {
      break;
    }
  }

  return {
    compilationError,
    testCaseResults: results,
    totalTime: Date.now() - startOverall
  };
}

module.exports = {
  runSubmissionExternal,
  PISTON_LANGUAGE_MAP,
  LANGUAGE_MAP
};
