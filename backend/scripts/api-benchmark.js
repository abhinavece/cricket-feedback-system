#!/usr/bin/env node
/**
 * API Benchmark Script
 * Tests all endpoints and measures response time, payload size, and data structure
 */

const axios = require('axios');
require('dotenv').config();

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5002/api';
let AUTH_TOKEN = null;

// Results storage
const results = {
  timestamp: new Date().toISOString(),
  phase: process.argv[2] || 'BEFORE',
  endpoints: []
};

// Helper to format bytes
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// Test endpoint and collect metrics
async function testEndpoint(method, path, description, options = {}) {
  const { auth = true, body = null, queryParams = '' } = options;
  const url = `${BASE_URL}${path}${queryParams}`;
  
  const config = {
    method,
    url,
    headers: auth && AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {},
    data: body,
    timeout: 30000
  };

  const startTime = Date.now();
  let result = {
    method,
    path: path + queryParams,
    description,
    status: null,
    responseTime: null,
    payloadSize: null,
    payloadSizeFormatted: null,
    recordCount: null,
    sampleFields: [],
    redundantFields: [],
    issues: [],
    recommendation: null
  };

  try {
    const response = await axios(config);
    const endTime = Date.now();
    const responseData = JSON.stringify(response.data);
    
    result.status = response.status;
    result.responseTime = endTime - startTime;
    result.payloadSize = Buffer.byteLength(responseData, 'utf8');
    result.payloadSizeFormatted = formatBytes(result.payloadSize);
    
    // Analyze response structure
    const data = response.data;
    
    // Count records if array or has data/feedback/matches/payments property
    if (Array.isArray(data)) {
      result.recordCount = data.length;
      if (data.length > 0) {
        result.sampleFields = Object.keys(data[0]);
      }
    } else if (data.feedback && Array.isArray(data.feedback)) {
      result.recordCount = data.feedback.length;
      if (data.feedback.length > 0) {
        result.sampleFields = Object.keys(data.feedback[0]);
      }
    } else if (data.matches && Array.isArray(data.matches)) {
      result.recordCount = data.matches.length;
      if (data.matches.length > 0) {
        result.sampleFields = Object.keys(data.matches[0]);
      }
    } else if (data.payments && Array.isArray(data.payments)) {
      result.recordCount = data.payments.length;
      if (data.payments.length > 0) {
        result.sampleFields = Object.keys(data.payments[0]);
      }
    } else if (data.data && Array.isArray(data.data)) {
      result.recordCount = data.data.length;
      if (data.data.length > 0) {
        result.sampleFields = Object.keys(data.data[0]);
      }
    }
    
    // Identify issues
    if (result.payloadSize > 50000) {
      result.issues.push('Large payload (>50KB)');
    }
    if (result.responseTime > 500) {
      result.issues.push('Slow response (>500ms)');
    }
    if (result.sampleFields.includes('feedbackText') && path.includes('summary') === false && path !== '/feedback/:id') {
      result.issues.push('Contains large text field');
    }
    if (result.sampleFields.includes('screenshotImage')) {
      result.issues.push('Contains binary image data');
    }
    if (result.sampleFields.includes('paymentHistory')) {
      result.issues.push('Contains nested history array');
    }
    
  } catch (error) {
    result.status = error.response?.status || 'ERROR';
    result.error = error.message;
    result.responseTime = Date.now() - startTime;
  }

  results.endpoints.push(result);
  
  // Console output
  const statusIcon = result.status === 200 || result.status === 201 ? '✓' : '✗';
  const sizeColor = result.payloadSize > 50000 ? '\x1b[31m' : result.payloadSize > 10000 ? '\x1b[33m' : '\x1b[32m';
  const timeColor = result.responseTime > 500 ? '\x1b[31m' : result.responseTime > 200 ? '\x1b[33m' : '\x1b[32m';
  
  console.log(`${statusIcon} ${method.padEnd(6)} ${path.padEnd(45)} ${timeColor}${String(result.responseTime + 'ms').padEnd(8)}\x1b[0m ${sizeColor}${result.payloadSizeFormatted.padEnd(12)}\x1b[0m ${result.recordCount !== null ? `(${result.recordCount} records)` : ''}`);
  
  if (result.issues.length > 0) {
    console.log(`   ⚠️  Issues: ${result.issues.join(', ')}`);
  }
  
  return result;
}

// Get auth token
async function authenticate() {
  console.log('\n🔐 Authenticating...\n');
  
  // For testing, we'll use a mock token or try to get one
  // In real scenario, you'd authenticate with Google OAuth
  try {
    // Try to use existing token from environment or create a test scenario
    const response = await axios.post(`${BASE_URL}/admin/authenticate`, {
      password: process.env.ADMIN_PASSWORD || 'cricket123'
    });
    
    if (response.data.success) {
      console.log('✓ Admin authentication successful\n');
      // Note: This endpoint doesn't return a JWT, so we need to handle differently
    }
  } catch (error) {
    console.log('⚠️  Admin auth failed, some endpoints may return 401\n');
  }
  
  // For testing authenticated endpoints, we'll use a test JWT if available
  AUTH_TOKEN = process.env.TEST_JWT_TOKEN || null;
  
  if (!AUTH_TOKEN) {
    console.log('⚠️  No JWT token available. Testing public endpoints only.\n');
    console.log('   Set TEST_JWT_TOKEN environment variable for full testing.\n');
  }
}

// Main test function
async function runBenchmark() {
  console.log('╔════════════════════════════════════════════════════════════════════════════════╗');
  console.log(`║  API BENCHMARK - ${results.phase} OPTIMIZATION                                         ║`);
  console.log('╠════════════════════════════════════════════════════════════════════════════════╣');
  console.log(`║  Base URL: ${BASE_URL.padEnd(67)}║`);
  console.log(`║  Timestamp: ${results.timestamp.padEnd(66)}║`);
  console.log('╚════════════════════════════════════════════════════════════════════════════════╝\n');

  await authenticate();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  METHOD  PATH                                          TIME     SIZE         RECORDS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // ═══════════════════════════════════════════════════════════════════════════════
  // HEALTH CHECK
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('\n📡 HEALTH & AUTH ENDPOINTS');
  console.log('─'.repeat(80));
  
  await testEndpoint('GET', '/health', 'Health check', { auth: false });

  // ═══════════════════════════════════════════════════════════════════════════════
  // FEEDBACK ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('\n📝 FEEDBACK ENDPOINTS');
  console.log('─'.repeat(80));
  
  await testEndpoint('GET', '/feedback/stats', 'Feedback statistics');
  await testEndpoint('GET', '/feedback/summary', 'Feedback summary (lightweight)', { queryParams: '?page=1&limit=10' });
  await testEndpoint('GET', '/feedback', 'Feedback list (full)', { queryParams: '?page=1&limit=10' });
  await testEndpoint('GET', '/feedback/trash', 'Deleted feedback');

  // ═══════════════════════════════════════════════════════════════════════════════
  // PLAYER ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('\n👥 PLAYER ENDPOINTS');
  console.log('─'.repeat(80));
  
  await testEndpoint('GET', '/players', 'All active players');

  // ═══════════════════════════════════════════════════════════════════════════════
  // MATCH ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('\n🏏 MATCH ENDPOINTS');
  console.log('─'.repeat(80));
  
  await testEndpoint('GET', '/matches/summary', 'Matches summary (lightweight)', { queryParams: '?page=1&limit=10' });
  await testEndpoint('GET', '/matches', 'Matches list (full)', { queryParams: '?page=1&limit=10' });

  // ═══════════════════════════════════════════════════════════════════════════════
  // AVAILABILITY ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('\n📅 AVAILABILITY ENDPOINTS');
  console.log('─'.repeat(80));
  
  await testEndpoint('GET', '/availability/stats/summary', 'Availability stats summary');

  // ═══════════════════════════════════════════════════════════════════════════════
  // PAYMENT ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('\n💰 PAYMENT ENDPOINTS');
  console.log('─'.repeat(80));
  
  await testEndpoint('GET', '/payments', 'All payments');
  await testEndpoint('GET', '/payments/summary', 'Payments summary (lightweight)');

  // ═══════════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('\n\n');
  console.log('╔════════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                              BENCHMARK SUMMARY                                  ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════════╝\n');

  const successCount = results.endpoints.filter(e => e.status === 200 || e.status === 201).length;
  const failCount = results.endpoints.filter(e => e.status !== 200 && e.status !== 201).length;
  const totalPayload = results.endpoints.reduce((sum, e) => sum + (e.payloadSize || 0), 0);
  const avgResponseTime = results.endpoints.reduce((sum, e) => sum + (e.responseTime || 0), 0) / results.endpoints.length;
  const issueEndpoints = results.endpoints.filter(e => e.issues && e.issues.length > 0);

  console.log(`  Total Endpoints Tested: ${results.endpoints.length}`);
  console.log(`  Successful: ${successCount} | Failed: ${failCount}`);
  console.log(`  Total Payload Size: ${formatBytes(totalPayload)}`);
  console.log(`  Average Response Time: ${avgResponseTime.toFixed(0)}ms`);
  console.log(`  Endpoints with Issues: ${issueEndpoints.length}`);

  if (issueEndpoints.length > 0) {
    console.log('\n  ⚠️  ENDPOINTS REQUIRING OPTIMIZATION:');
    issueEndpoints.forEach(e => {
      console.log(`     - ${e.method} ${e.path}: ${e.issues.join(', ')}`);
    });
  }

  // Large payload endpoints
  const largePayloads = results.endpoints
    .filter(e => e.payloadSize > 10000)
    .sort((a, b) => b.payloadSize - a.payloadSize);

  if (largePayloads.length > 0) {
    console.log('\n  📊 LARGEST PAYLOADS:');
    largePayloads.forEach(e => {
      console.log(`     - ${e.method} ${e.path}: ${e.payloadSizeFormatted}`);
    });
  }

  // Slow endpoints
  const slowEndpoints = results.endpoints
    .filter(e => e.responseTime > 200)
    .sort((a, b) => b.responseTime - a.responseTime);

  if (slowEndpoints.length > 0) {
    console.log('\n  ⏱️  SLOWEST ENDPOINTS:');
    slowEndpoints.forEach(e => {
      console.log(`     - ${e.method} ${e.path}: ${e.responseTime}ms`);
    });
  }

  console.log('\n');

  // Save results to file
  const fs = require('fs');
  const filename = `benchmark-${results.phase.toLowerCase()}-${Date.now()}.json`;
  fs.writeFileSync(
    `/Users/abhinav/Documents/FUN_PROJECTS/survey-project/backend/scripts/${filename}`,
    JSON.stringify(results, null, 2)
  );
  console.log(`  📁 Results saved to: scripts/${filename}\n`);

  return results;
}

// Run benchmark
runBenchmark().catch(console.error);
