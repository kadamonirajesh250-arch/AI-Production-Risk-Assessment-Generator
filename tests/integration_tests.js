const app = require('../backend/server');
const http = require('http');

const PORT = 3001;
let server;

// Helper to make HTTP requests
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// Test Runner
async function runTests() {
  console.log('--- STARTING INTEGRATION TESTS ---');
  let passedTests = 0;
  let totalTests = 0;

  const assert = (condition, message) => {
    totalTests++;
    if (condition) {
      console.log(`[PASS] - ${message}`);
      passedTests++;
    } else {
      console.error(`[FAIL] - ${message}`);
    }
  };

  try {
    // 1. Start Server
    await new Promise(resolve => {
      server = app.listen(PORT, () => {
        resolve();
      });
    });
    console.log(`Test server online on port ${PORT}.\n`);

    // Test 1: GET /api/presets
    const resPresets = await makeRequest('GET', '/api/presets');
    assert(resPresets.statusCode === 200, 'GET /api/presets returns status 200');
    assert(Array.isArray(resPresets.body), 'Presets response is an array');
    assert(resPresets.body.length > 0, 'Presets database has seeded elements');

    // Test 2: GET /api/templates
    const resTemplates = await makeRequest('GET', '/api/templates');
    assert(resTemplates.statusCode === 200, 'GET /api/templates returns status 200');
    assert(resTemplates.body.find(p => p.version === 'v4') !== undefined, 'Prompt v4 exists in database');

    // Test 3: POST /api/generate (Simulator Mode)
    const testPayload = {
      projectName: 'Test Suite Short Film',
      projectManager: 'Automation Agent',
      productionScope: 'A CGI character VFX shoot with audio dubbing tracks.',
      timeline: '2 weeks timeline, rolling deliverables.',
      resourcePlan: '1 compositor, 1 translator, local rendering.'
    };
    
    console.log('Sending mock generation request (simulating latency)...');
    const resGenerate = await makeRequest('POST', '/api/generate', testPayload);
    
    assert(resGenerate.statusCode === 200, 'POST /api/generate returns status 200');
    assert(resGenerate.body.success === true, 'Response returns success status true');
    assert(resGenerate.body.data !== undefined, 'Response contains data object');
    assert(resGenerate.body.data.id.startsWith('gen_'), 'Created ID matches generator format');
    assert(resGenerate.body.data.responseText.includes('# AI Production Risk Assessment'), 'Markdown report header generated');
    
    const genId = resGenerate.body.data.id;

    // Test 4: POST /api/feedback
    const feedbackPayload = {
      id: genId,
      rating: 4,
      feedback: 'Automated integration test feedback.'
    };
    const resFeedback = await makeRequest('POST', '/api/feedback', feedbackPayload);
    assert(resFeedback.statusCode === 200, 'POST /api/feedback returns status 200');
    assert(resFeedback.body.success === true, 'Feedback submission returns success true');
    assert(resFeedback.body.data.rating === 4, 'Rating stored as 4 stars');
    assert(resFeedback.body.data.feedback === feedbackPayload.feedback, 'Comment saved correctly');

    // Test 5: GET /api/admin/analytics
    const resAnalytics = await makeRequest('GET', '/api/admin/analytics');
    assert(resAnalytics.statusCode === 200, 'GET /api/admin/analytics returns status 200');
    assert(resAnalytics.body.totalGenerations > 0, 'Analytics registers total generations > 0');
    assert(resAnalytics.body.averageRating > 0, 'Analytics averages out ratings above 0');

    // Test 6: GET /api/history/:id
    const resDetail = await makeRequest('GET', `/api/history/${genId}`);
    assert(resDetail.statusCode === 200, 'GET /api/history/:id returns status 200');
    assert(resDetail.body.projectName === testPayload.projectName, 'Retrieved record projectName matches parameters');

    // Test 7: DELETE /api/history/:id
    console.log('Testing record deletion...');
    const resDelete = await makeRequest('DELETE', `/api/history/${genId}`);
    assert(resDelete.statusCode === 200, 'DELETE /api/history/:id returns status 200');
    assert(resDelete.body.success === true, 'Deletion returns success status true');

    // Verify deleted record is gone (GET should return 404)
    const resDeletedCheck = await makeRequest('GET', `/api/history/${genId}`);
    assert(resDeletedCheck.statusCode === 404, 'GET /api/history/:id on deleted record returns status 404');

    // Summary
    console.log(`\n--- TEST SUMMARY ---`);
    console.log(`Total assertions: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${totalTests - passedTests}`);

    if (passedTests === totalTests) {
      console.log('\nALL INTEGRATION TESTS PASSED SUCCESSFULLY! ✅');
      process.exitCode = 0;
    } else {
      console.error('\nSOME INTEGRATION TESTS FAILED. ❌');
      process.exitCode = 1;
    }

  } catch (error) {
    console.error('Integration test suite encountered uncaught error:', error);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close(() => {
        console.log('Test server offline. Executed teardowns.');
      });
    }
  }
}

// Run
runTests();
