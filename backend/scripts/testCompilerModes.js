/**
 * Test script to verify the compiler system works in both modes
 * Run this to test before deployment
 * 
 * Usage:
 *   node scripts/testCompilerModes.js
 */

const { runSubmission } = require('../utils/judge');

// Sample test cases
const testCases = [
  {
    input: '',
    expectedOutput: 'Hello, World!',
    marks: 10
  }
];

// Test codes for different languages
const testCodes = {
  javascript: `console.log('Hello, World!');`,
  
  python: `print('Hello, World!')`,
  
  java: `
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
  `.trim()
};

async function testLanguage(language, code) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing ${language.toUpperCase()}...`);
  console.log('='.repeat(60));
  
  try {
    const result = await runSubmission({
      language,
      code,
      testCases,
      timeLimit: 5000,
      memoryLimit: 256000
    });

    console.log('Result:', JSON.stringify(result, null, 2));

    if (result.compilationError) {
      console.log(`❌ FAILED: Compilation error - ${result.compilationError}`);
      return false;
    }

    const allPassed = result.testCaseResults.every(tc => tc.status === 'passed');
    if (allPassed) {
      console.log(`✅ SUCCESS: All test cases passed!`);
      return true;
    } else {
      console.log(`❌ FAILED: Some test cases failed`);
      result.testCaseResults.forEach((tc, idx) => {
        console.log(`  Test ${idx + 1}: ${tc.status} - Output: "${tc.output}"`);
      });
      return false;
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    console.error(error);
    return false;
  }
}

async function runTests() {
  console.log('\n🧪 COMPILER SYSTEM TEST');
  console.log('='.repeat(60));
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`USE_EXTERNAL_JUDGE: ${process.env.USE_EXTERNAL_JUDGE || 'false'}`);
  console.log(`VERCEL: ${process.env.VERCEL || 'false'}`);
  console.log('='.repeat(60));

  const results = {
    javascript: false,
    python: false,
    java: false
  };

  // Test each language
  for (const [language, code] of Object.entries(testCodes)) {
    results[language] = await testLanguage(language, code);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait between tests
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  
  Object.entries(results).forEach(([lang, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${lang.padEnd(15)}: ${passed ? 'PASSED' : 'FAILED'}`);
  });

  const allPassed = Object.values(results).every(r => r);
  console.log('\n' + '='.repeat(60));
  console.log(allPassed ? '🎉 ALL TESTS PASSED!' : '⚠️ SOME TESTS FAILED');
  console.log('='.repeat(60));

  if (!allPassed) {
    console.log('\n💡 Troubleshooting Tips:');
    
    if (!results.python) {
      console.log('  • Python: Install Python 3 or set USE_EXTERNAL_JUDGE=true');
    }
    if (!results.java) {
      console.log('  • Java: Install JDK or set USE_EXTERNAL_JUDGE=true');
    }
    if (!results.javascript) {
      console.log('  • JavaScript: Check Node.js installation');
    }
    
    console.log('\n  To test with external API:');
    console.log('    USE_EXTERNAL_JUDGE=true node scripts/testCompilerModes.js');
  }

  process.exit(allPassed ? 0 : 1);
}

// Run the tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
