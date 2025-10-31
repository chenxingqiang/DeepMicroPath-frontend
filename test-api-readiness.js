#!/usr/bin/env node
/**
 * DeepMicroPath API Readiness Test
 * Tests all API endpoints to verify backend connectivity
 */

const API_BASE_URL = process.env.API_URL || 'http://172.20.1.38:8000';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, status, details = '') {
  const icon = status === 'pass' ? '✓' : status === 'fail' ? '✗' : '⚠';
  const color = status === 'pass' ? 'green' : status === 'fail' ? 'red' : 'yellow';
  log(`${icon} ${name}`, color);
  if (details) {
    console.log(`  ${details}`);
  }
}

async function testEndpoint(name, url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    const data = await response.json().catch(() => null);
    
    return {
      name,
      success: response.ok,
      status: response.status,
      data,
    };
  } catch (error) {
    return {
      name,
      success: false,
      error: error.message,
    };
  }
}

async function runTests() {
  log('\n='.repeat(60), 'cyan');
  log('DeepMicroPath API Readiness Test', 'cyan');
  log('='.repeat(60), 'cyan');
  log(`\nTesting API at: ${API_BASE_URL}\n`, 'blue');

  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
  };

  // Test 1: Root endpoint
  log('\n1. Testing Root Endpoint', 'blue');
  const rootTest = await testEndpoint(
    'GET /',
    `${API_BASE_URL}/`
  );
  if (rootTest.success) {
    logTest('Root endpoint', 'pass', `Service: ${rootTest.data?.service || 'N/A'}`);
    results.passed++;
  } else {
    logTest('Root endpoint', 'fail', rootTest.error || `Status: ${rootTest.status}`);
    results.failed++;
  }

  // Test 2: Health check
  log('\n2. Testing Health Check', 'blue');
  const healthTest = await testEndpoint(
    'GET /api/v1/health',
    `${API_BASE_URL}/api/v1/health`
  );
  if (healthTest.success) {
    logTest('Health check', 'pass', `Status: ${healthTest.data?.status || 'N/A'}`);
    results.passed++;
  } else {
    logTest('Health check', 'fail', healthTest.error || `Status: ${healthTest.status}`);
    results.failed++;
  }

  // Test 3: List files
  log('\n3. Testing File Listing', 'blue');
  const filesTest = await testEndpoint(
    'GET /api/v1/files',
    `${API_BASE_URL}/api/v1/files`
  );
  if (filesTest.success) {
    const fileCount = filesTest.data?.files?.length || 0;
    logTest('List files', 'pass', `Found ${fileCount} files`);
    results.passed++;
  } else {
    logTest('List files', 'fail', filesTest.error || `Status: ${filesTest.status}`);
    results.failed++;
  }

  // Test 4: Submit inference (chat mode)
  log('\n4. Testing Inference Submission (Chat Mode)', 'blue');
  const chatInferenceTest = await testEndpoint(
    'POST /api/v1/inference/submit',
    `${API_BASE_URL}/api/v1/inference/submit`,
    {
      method: 'POST',
      body: JSON.stringify({
        mode: 'chat',
        question: 'Test question: What is 2+2?',
        input_files: [],
        parameters: {
          temperature: 0.5,
        },
      }),
    }
  );
  if (chatInferenceTest.success && chatInferenceTest.data?.job_id) {
    logTest('Submit chat inference', 'pass', `Job ID: ${chatInferenceTest.data.job_id}`);
    results.passed++;

    // Test 4a: Check job status
    const jobId = chatInferenceTest.data.job_id;
    log('\n4a. Testing Job Status Check', 'blue');
    const statusTest = await testEndpoint(
      `GET /api/v1/inference/${jobId}`,
      `${API_BASE_URL}/api/v1/inference/${jobId}`
    );
    if (statusTest.success) {
      logTest('Check job status', 'pass', `Status: ${statusTest.data?.status || 'N/A'}`);
      results.passed++;
    } else {
      logTest('Check job status', 'fail', statusTest.error || `Status: ${statusTest.status}`);
      results.failed++;
    }
  } else {
    logTest('Submit chat inference', 'fail', chatInferenceTest.error || `Status: ${chatInferenceTest.status}`);
    results.failed++;
  }

  // Test 5: Submit inference (deepresearch mode)
  log('\n5. Testing Inference Submission (Deep Research Mode)', 'blue');
  const researchInferenceTest = await testEndpoint(
    'POST /api/v1/inference/submit',
    `${API_BASE_URL}/api/v1/inference/submit`,
    {
      method: 'POST',
      body: JSON.stringify({
        mode: 'deepresearch',
        question: 'Test question: Explain quantum computing',
        input_files: [],
        parameters: {
          temperature: 0.7,
        },
      }),
    }
  );
  if (researchInferenceTest.success && researchInferenceTest.data?.job_id) {
    logTest('Submit deepresearch inference', 'pass', `Job ID: ${researchInferenceTest.data.job_id}`);
    results.passed++;
  } else {
    logTest('Submit deepresearch inference', 'fail', researchInferenceTest.error || `Status: ${researchInferenceTest.status}`);
    results.failed++;
  }

  // Test 6: Submit inference (microbiology-report mode)
  log('\n6. Testing Inference Submission (Microbiology Report Mode)', 'blue');
  const microbiologyInferenceTest = await testEndpoint(
    'POST /api/v1/inference/submit',
    `${API_BASE_URL}/api/v1/inference/submit`,
    {
      method: 'POST',
      body: JSON.stringify({
        mode: 'microbiology-report',
        question: 'Test: Analyze microbiology data',
        input_files: [],
        parameters: {
          temperature: 0.5,
        },
      }),
    }
  );
  if (microbiologyInferenceTest.success && microbiologyInferenceTest.data?.job_id) {
    logTest('Submit microbiology inference', 'pass', `Job ID: ${microbiologyInferenceTest.data.job_id}`);
    results.passed++;
  } else {
    logTest('Submit microbiology inference', 'fail', microbiologyInferenceTest.error || `Status: ${microbiologyInferenceTest.status}`);
    results.failed++;
  }

  // Test 7: Submit inference (auto mode)
  log('\n7. Testing Inference Submission (Auto Mode)', 'blue');
  const autoInferenceTest = await testEndpoint(
    'POST /api/v1/inference/submit',
    `${API_BASE_URL}/api/v1/inference/submit`,
    {
      method: 'POST',
      body: JSON.stringify({
        mode: 'auto',
        question: 'Test: Auto mode detection',
        input_files: [],
        parameters: {},
      }),
    }
  );
  if (autoInferenceTest.success && autoInferenceTest.data?.job_id) {
    logTest('Submit auto inference', 'pass', `Job ID: ${autoInferenceTest.data.job_id}`);
    results.passed++;
  } else {
    logTest('Submit auto inference', 'fail', autoInferenceTest.error || `Status: ${autoInferenceTest.status}`);
    results.failed++;
  }

  // Test 8: List jobs
  log('\n8. Testing Job Listing', 'blue');
  const jobsTest = await testEndpoint(
    'GET /api/v1/inference/jobs',
    `${API_BASE_URL}/api/v1/inference/jobs?limit=10`
  );
  if (jobsTest.success) {
    const jobCount = jobsTest.data?.jobs?.length || 0;
    logTest('List jobs', 'pass', `Found ${jobCount} jobs`);
    results.passed++;
  } else {
    logTest('List jobs', 'fail', jobsTest.error || `Status: ${jobsTest.status}`);
    results.failed++;
  }

  // Test 9: API Documentation
  log('\n9. Testing API Documentation', 'blue');
  const docsTest = await testEndpoint(
    'GET /docs',
    `${API_BASE_URL}/docs`
  );
  if (docsTest.success || docsTest.status === 200) {
    logTest('API docs available', 'pass', 'OpenAPI documentation accessible');
    results.passed++;
  } else {
    logTest('API docs', 'warn', 'Documentation may not be available');
    results.warnings++;
  }

  // Summary
  log('\n' + '='.repeat(60), 'cyan');
  log('Test Summary', 'cyan');
  log('='.repeat(60), 'cyan');
  log(`\n✓ Passed: ${results.passed}`, 'green');
  log(`✗ Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'reset');
  log(`⚠ Warnings: ${results.warnings}`, results.warnings > 0 ? 'yellow' : 'reset');
  
  const total = results.passed + results.failed + results.warnings;
  const percentage = ((results.passed / total) * 100).toFixed(1);
  
  log(`\nSuccess Rate: ${percentage}%`, percentage >= 80 ? 'green' : 'yellow');
  
  if (results.failed === 0) {
    log('\n🎉 All critical tests passed! API is ready.', 'green');
  } else {
    log('\n⚠️  Some tests failed. Please check backend service.', 'red');
  }
  
  log('\n' + '='.repeat(60) + '\n', 'cyan');

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch((error) => {
  log(`\n✗ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
