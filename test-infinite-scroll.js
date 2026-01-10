#!/usr/bin/env node

/**
 * Test script to verify infinite scroll pagination
 * Run this in the browser console to test pagination behavior
 */

console.log('=== Infinite Scroll Pagination Test ===\n');

// Test 1: Verify API returns correct pagination data
console.log('Test 1: Checking API pagination response...');
fetch('http://localhost:5002/api/matches?page=1&limit=10', {
  headers: { 'Authorization': 'Bearer test' }
})
.then(res => res.json())
.then(data => {
  console.log('Page 1 Response:');
  console.log('- Matches received:', data.matches?.length || 0);
  console.log('- Total matches:', data.pagination?.total);
  console.log('- Current page:', data.pagination?.current);
  console.log('- Total pages:', data.pagination?.pages);
  
  // Calculate hasMore
  const pageNum = 1;
  const limit = 10;
  const total = data.pagination?.total || 0;
  const hasMore = (pageNum * limit) < total;
  console.log('- Calculated hasMore:', hasMore);
  console.log('- Formula: (1 * 10) < ' + total + ' = ' + hasMore);
  
  // Test page 2
  console.log('\nTest 2: Checking page 2...');
  return fetch('http://localhost:5002/api/matches?page=2&limit=10', {
    headers: { 'Authorization': 'Bearer test' }
  }).then(res => res.json());
})
.then(data => {
  console.log('Page 2 Response:');
  console.log('- Matches received:', data.matches?.length || 0);
  console.log('- Total matches:', data.pagination?.total);
  console.log('- Current page:', data.pagination?.current);
  
  // Calculate hasMore for page 2
  const pageNum = 2;
  const limit = 10;
  const total = data.pagination?.total || 0;
  const hasMore = (pageNum * limit) < total;
  console.log('- Calculated hasMore:', hasMore);
  console.log('- Formula: (2 * 10) < ' + total + ' = ' + hasMore);
  
  // Test page 3
  console.log('\nTest 3: Checking page 3...');
  return fetch('http://localhost:5002/api/matches?page=3&limit=10', {
    headers: { 'Authorization': 'Bearer test' }
  }).then(res => res.json());
})
.then(data => {
  console.log('Page 3 Response:');
  console.log('- Matches received:', data.matches?.length || 0);
  console.log('- Total matches:', data.pagination?.total);
  console.log('- Current page:', data.pagination?.current);
  
  // Calculate hasMore for page 3
  const pageNum = 3;
  const limit = 10;
  const total = data.pagination?.total || 0;
  const hasMore = (pageNum * limit) < total;
  console.log('- Calculated hasMore:', hasMore);
  console.log('- Formula: (3 * 10) < ' + total + ' = ' + hasMore);
  
  console.log('\n=== Test Complete ===');
  console.log('\nExpected behavior:');
  console.log('- Page 1: hasMore = true (10 < 21)');
  console.log('- Page 2: hasMore = true (20 < 21)');
  console.log('- Page 3: hasMore = false (30 < 21 = false)');
})
.catch(err => console.error('Error:', err));
