# 🔧 Code Compilation in Vercel Serverless

## ⚠️ Important Notice

Vercel's serverless environment has **limited compiler support**. Here's what works and what doesn't:

## 🎯 Your Project Language Support

**INFOVERSE uses only 3 languages:**
- Python
- JavaScript  
- Java

**Note**: C/C++ are NOT part of your project - no need to worry about them!

---

## ✅ What Works Out of the Box

### Python
- ✅ **Fully Supported** - 100% Works
- Python 3.9+ available in Vercel
- No additional setup needed
- **Status**: Ready to use ✅

### JavaScript/Node.js
- ✅ **Fully Supported** - 100% Works
- Node.js 18+ available
- Native support
- **Status**: Ready to use ✅

## ⚠️ What May Not Work

### Java (JDK)
- ⚠️ **May Not Be Available** in Vercel serverless
- JDK not installed by default in Vercel
- If Java compilation fails, use external API
- **Status**: Test in production, fallback available

---

## 🚀 Solution: External Code Execution APIs

When built-in compilers are unavailable, use external code execution services:

### Recommended Services

#### 1. **Piston API** (Free, Open Source)
- Website: https://github.com/engineer-man/piston
- Public API: https://emkc.org/api/v2/piston
- Supports: 50+ languages
- Free tier: Yes
- Rate limit: Generous

#### 2. **Judge0** (Freemium)
- Website: https://judge0.com/
- Public API: https://ce.judge0.com/
- Supports: 60+ languages
- Free tier: 50 requests/day
- Paid plans available

#### 3. **Glot.io** (Freemium)
- Website: https://glot.io/
- API: https://glot.io/api
- Supports: 30+ languages
- Free tier: Limited

---

## 🔨 Implementation Guide

### Option 1: Modify Existing Judge (Hybrid Approach)

Update `backend/utils/judge.js` to detect serverless and fallback to external API:

```javascript
// backend/utils/judge.js

const axios = require('axios');

// Check if we're in serverless and compilers unavailable
const USE_EXTERNAL_API = process.env.VERCEL === '1' && process.env.USE_EXTERNAL_COMPILER === 'true';

async function runSubmissionExternal({ language, code, testCases, timeLimit }) {
  const results = [];
  
  for (const testCase of testCases) {
    try {
      const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
        language: mapLanguage(language),
        version: '*',
        files: [{ name: 'main', content: code }],
        stdin: testCase.input,
        compile_timeout: 10000,
        run_timeout: timeLimit || 2000,
        compile_memory_limit: 256000,
        run_memory_limit: 256000
      }, {
        timeout: 15000
      });

      const { run, compile } = response.data;
      
      if (compile && compile.code !== 0) {
        return {
          compilationError: compile.stderr || compile.stdout || 'Compilation failed',
          testCaseResults: [],
          totalTime: 0
        };
      }

      const output = normalizeOutput(run.stdout || '');
      const expected = normalizeOutput(testCase.expectedOutput || '');
      
      results.push({
        status: output === expected ? 'passed' : 'failed',
        executionTime: run.time || 0,
        memoryUsed: run.memory || 0,
        output: output,
        error: run.stderr || '',
        marksAwarded: output === expected ? (testCase.marks || 0) : 0,
        maxMarks: testCase.marks || 0,
        isHidden: !!testCase.isHidden
      });

    } catch (error) {
      results.push({
        status: 'runtime_error',
        executionTime: 0,
        memoryUsed: 0,
        output: '',
        error: error.message,
        marksAwarded: 0,
        maxMarks: testCase.marks || 0,
        isHidden: !!testCase.isHidden
      });
    }
  }

  return {
    compilationError: '',
    testCaseResults: results,
    totalTime: results.reduce((sum, r) => sum + r.executionTime, 0)
  };
}

function mapLanguage(lang) {
  const mapping = {
    'python': 'python',
    'py': 'python',
    'javascript': 'javascript',
    'js': 'javascript',
    'node': 'javascript',
    'c': 'c',
    'cpp': 'c++',
    'c++': 'c++',
    'java': 'java'
  };
  return mapping[lang.toLowerCase()] || lang;
}

// Main function that chooses between local and external
async function runSubmission(options) {
  const { language } = options;
  
  // Use external API for C/C++/Java in serverless
  if (USE_EXTERNAL_API && ['c', 'cpp', 'c++', 'java'].includes(language.toLowerCase())) {
    console.log(`🌐 Using external API for ${language} (serverless mode)`);
    return runSubmissionExternal(options);
  }
  
  // Use local execution for Python/JS or in non-serverless
  console.log(`💻 Using local execution for ${language}`);
  return runSubmissionLocal(options);
}

// Rename existing runSubmission to runSubmissionLocal
async function runSubmissionLocal(options) {
  // ... existing code ...
}

module.exports = { runSubmission };
```

### Option 2: Create Separate Judge Module

Create `backend/utils/judge-external.js`:

```javascript
// backend/utils/judge-external.js
const axios = require('axios');

async function runCode({ language, code, input, timeLimit = 2000 }) {
  try {
    const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
      language: mapLanguage(language),
      version: '*',
      files: [{ content: code }],
      stdin: input || '',
      compile_timeout: 10000,
      run_timeout: timeLimit,
      compile_memory_limit: 256000,
      run_memory_limit: 256000
    }, {
      timeout: 15000
    });

    const { run, compile } = response.data;
    
    if (compile && compile.code !== 0) {
      return {
        success: false,
        compilationError: compile.stderr || 'Compilation failed',
        output: '',
        error: compile.stderr || ''
      };
    }

    return {
      success: run.code === 0,
      output: run.stdout || '',
      error: run.stderr || '',
      executionTime: run.time || 0
    };

  } catch (error) {
    return {
      success: false,
      output: '',
      error: `External API Error: ${error.message}`,
      compilationError: ''
    };
  }
}

function mapLanguage(lang) {
  const mapping = {
    'python': 'python', 'py': 'python',
    'javascript': 'javascript', 'js': 'javascript', 'node': 'javascript',
    'c': 'c',
    'cpp': 'c++', 'c++': 'c++',
    'java': 'java'
  };
  return mapping[lang.toLowerCase()] || lang;
}

module.exports = { runCode };
```

---

## 🔧 Environment Variable Configuration

Add to `backend/.env`:

```bash
# Code Execution Configuration
USE_EXTERNAL_COMPILER=true   # Set to 'true' in Vercel
EXTERNAL_API_URL=https://emkc.org/api/v2/piston/execute
```

Add to Vercel backend environment variables:
```
USE_EXTERNAL_COMPILER=true
```

---

## 🧪 Testing

### Test Locally First
```bash
# Test with local compilers (should work if installed)
cd backend
node -e "require('./utils/judge').runSubmission({language: 'python', code: 'print(42)', testCases: [{input: '', expectedOutput: '42', marks: 10}]}).then(console.log)"
```

### Test in Production
After deploying to Vercel:
1. Login as trainer
2. Create test contest with C/C++/Java questions
3. Login as student
4. Submit code and verify results

If compilation fails, implement external API solution above.

---

## 📊 Performance Comparison

| Method | Latency | Cost | Reliability | Languages |
|--------|---------|------|-------------|-----------|
| **Local** | 100-500ms | Free | High* | Python, JS |
| **Piston** | 500-2000ms | Free | High | 50+ |
| **Judge0** | 500-2000ms | Paid | Very High | 60+ |

*Local only works if compilers are available

---

## 🎯 Recommended Approach

### For Production Deployment on Vercel:

**Your INFOVERSE Project (Python, JavaScript, Java only):**

1. **Use Local Execution** for:
   - Python ✅ (100% works)
   - JavaScript/Node.js ✅ (100% works)

2. **Use External API IF NEEDED** for:
   - Java (only if JDK unavailable in Vercel)

3. **Recommended Approach**:
   - Deploy and test first
   - Python & JavaScript will work immediately ✅
   - If Java fails, implement external API (5 min setup)
   - No need to worry about C/C++ (not in your project)

### Configuration:
```javascript
// backend/utils/judge.js
const shouldUseExternal = (language) => {
  // In Vercel serverless
  if (process.env.VERCEL === '1') {
    // Use external for C/C++/Java
    return ['c', 'cpp', 'c++', 'java'].includes(language.toLowerCase());
  }
  // Local development - use built-in
  return false;
};
```

---

## 📝 Alternative: Separate Compilation Service

### Advanced Solution

Deploy a separate compilation service (Docker container) on:
- AWS Lambda
- Google Cloud Run
- DigitalOcean App Platform
- Railway

This service handles all compilations and returns results to your Vercel backend.

**Architecture**:
```
Frontend (Vercel) 
    ↓
Backend API (Vercel) 
    ↓
Compilation Service (AWS Lambda/Cloud Run)
    ↓
Return Results
```

---

## 🚨 Current Status

### What's Already Implemented:
✅ Local compilation support (Python, JS, C, C++, Java)
✅ Temp file handling with `/tmp` for Vercel
✅ Automatic cleanup
✅ Error handling

### What You Need to Add (If Needed):
⚠️ External API integration (if C/C++/Java don't work)
⚠️ Fallback logic
⚠️ API key management (if using paid services)

---

## 🎓 Decision Guide

**Choose Local Only If:**
- You only need Python and JavaScript
- Testing locally works fine
- No C/C++/Java requirements

**Choose Hybrid Approach If:**
- You need all languages
- Want best performance for Python/JS
- Can handle external API latency for compiled languages

**Choose External Only If:**
- Simpler implementation preferred
- Consistent behavior across all languages
- Don't mind 1-2s extra latency

---

## 📚 Additional Resources

- [Piston API Docs](https://github.com/engineer-man/piston)
- [Judge0 API Docs](https://ce.judge0.com/)
- [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)

---

**Recommendation**: Start with local execution. If C/C++/Java fail in production, implement Piston API integration.
