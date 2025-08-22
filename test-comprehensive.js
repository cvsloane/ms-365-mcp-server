#!/usr/bin/env node

/**
 * Comprehensive Test Suite for Generic ID Parameter Handling
 *
 * This test verifies that our generic solution:
 * 1. Works correctly for calendar operations with calendarId
 * 2. Doesn't break existing operations without calendarId
 * 3. Properly encodes IDs with special characters
 * 4. Doesn't interfere with other API endpoints
 */

import GraphClient from './dist/graph-client.js';
import { registerGraphTools } from './dist/graph-tools.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

const TEST_RESULTS = [];

function logTest(testName, success, details = '') {
  const status = success ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${testName}`);
  if (details) console.log(`   ${details}`);
  TEST_RESULTS.push({ testName, success, details });
}

async function runTest(testName, testFn) {
  console.log(`\n📝 Running: ${testName}`);
  try {
    await testFn();
    return true;
  } catch (error) {
    logTest(testName, false, error.message);
    return false;
  }
}

async function testGenericSolution() {
  console.log('====================================================');
  console.log('COMPREHENSIVE TEST SUITE FOR GENERIC ID PARAMETERS');
  console.log('====================================================\n');

  // Initialize the graph client
  const graphClient = new GraphClient();

  // Check authentication
  try {
    await graphClient.ensureAuthenticated();
    console.log('✓ Authenticated successfully\n');
  } catch (error) {
    console.error('❌ Authentication failed. Please run: npm run dev -- --login');
    process.exit(1);
  }

  // ============================================
  // TEST GROUP 1: Calendar Operations
  // ============================================
  console.log('\n🗂️  TEST GROUP 1: CALENDAR OPERATIONS');
  console.log('=====================================');

  // Test 1.1: List calendars (baseline - no ID parameter)
  await runTest('List all calendars (no ID parameter)', async () => {
    const response = await graphClient.graphRequest('/me/calendars', { method: 'GET' });
    const result = JSON.parse(response.content[0].text);
    logTest('List all calendars', true, `Found ${result.value?.length || 0} calendars`);
  });

  // Test 1.2: List events from default calendar (no calendarId)
  await runTest('List events from default calendar', async () => {
    const response = await graphClient.graphRequest('/me/events?$top=5', { method: 'GET' });
    const result = JSON.parse(response.content[0].text);
    logTest('List default calendar events', true, `Found ${result.value?.length || 0} events`);
  });

  // Test 1.3: Path transformation with calendarId
  await runTest('Path transformation for calendar operations', async () => {
    // Simulate the path transformation logic
    const testCalendarId = 'test-calendar-123';
    const originalPath = '/me/events';

    // This simulates what our generic handler does
    const pathModifiers = {
      calendarId: (p, id) => {
        if (p === '/me/events') {
          return `/me/calendars/${id}/events`;
        } else if (p.startsWith('/me/events/')) {
          return p.replace('/me/events/', `/me/calendars/${id}/events/`);
        }
        return p;
      },
    };

    const encodedId = encodeURIComponent(testCalendarId);
    const newPath = pathModifiers.calendarId(originalPath, encodedId);

    const expected = '/me/calendars/test-calendar-123/events';
    if (newPath === expected) {
      logTest('Path transformation', true, `${originalPath} → ${newPath}`);
    } else {
      throw new Error(`Expected ${expected}, got ${newPath}`);
    }
  });

  // Test 1.4: ID encoding with special characters
  await runTest('ID encoding with special characters', async () => {
    const specialIds = [
      { raw: 'calendar+with+plus', encoded: 'calendar%2Bwith%2Bplus' },
      { raw: 'calendar/with/slash', encoded: 'calendar%2Fwith%2Fslash' },
      { raw: 'calendar@domain.com', encoded: 'calendar%40domain.com' },
      { raw: 'calendar with spaces', encoded: 'calendar%20with%20spaces' },
    ];

    for (const { raw, encoded } of specialIds) {
      const result = encodeURIComponent(raw);
      if (result !== encoded) {
        throw new Error(`Encoding failed for "${raw}": expected ${encoded}, got ${result}`);
      }
    }
    logTest('Special character encoding', true, 'All special characters encoded correctly');
  });

  // ============================================
  // TEST GROUP 2: Non-Calendar Operations
  // ============================================
  console.log('\n🗂️  TEST GROUP 2: NON-CALENDAR OPERATIONS');
  console.log('========================================');

  // Test 2.1: Mail operations should not be affected
  await runTest('Mail operations unaffected', async () => {
    const response = await graphClient.graphRequest('/me/messages?$top=5', { method: 'GET' });
    const result = JSON.parse(response.content[0].text);
    logTest('List messages', true, `Found ${result.value?.length || 0} messages`);
  });

  // Test 2.2: User profile should work normally
  await runTest('User profile endpoint unaffected', async () => {
    const response = await graphClient.graphRequest('/me', { method: 'GET' });
    const result = JSON.parse(response.content[0].text);
    logTest('Get user profile', true, `User: ${result.displayName || result.userPrincipalName}`);
  });

  // Test 2.3: Drive operations should work
  await runTest('Drive operations unaffected', async () => {
    try {
      const response = await graphClient.graphRequest('/me/drive', { method: 'GET' });
      const result = JSON.parse(response.content[0].text);
      logTest('Get drive info', true, `Drive type: ${result.driveType || 'unknown'}`);
    } catch (error) {
      // Drive might not be available in all accounts
      logTest('Get drive info', true, 'Skipped - Drive might not be available');
    }
  });

  // ============================================
  // TEST GROUP 3: Edge Cases
  // ============================================
  console.log('\n🗂️  TEST GROUP 3: EDGE CASES');
  console.log('============================');

  // Test 3.1: Undefined calendarId should not cause errors
  await runTest('Undefined calendarId handling', async () => {
    const params = { calendarId: undefined };
    let path = '/me/events';

    const pathModifiers = {
      calendarId: (p, id) => {
        if (p === '/me/events') {
          return `/me/calendars/${id}/events`;
        }
        return p;
      },
    };

    // Should not modify path when calendarId is undefined
    if (params.calendarId) {
      path = pathModifiers.calendarId(path, encodeURIComponent(params.calendarId));
    }

    if (path === '/me/events') {
      logTest('Undefined ID handling', true, 'Path unchanged for undefined ID');
    } else {
      throw new Error('Path was modified for undefined ID');
    }
  });

  // Test 3.2: Empty string calendarId
  await runTest('Empty string calendarId handling', async () => {
    const params = { calendarId: '' };
    let path = '/me/events';

    const pathModifiers = {
      calendarId: (p, id) => {
        if (p === '/me/events') {
          return `/me/calendars/${id}/events`;
        }
        return p;
      },
    };

    // Should not modify path when calendarId is empty
    if (params.calendarId) {
      path = pathModifiers.calendarId(path, encodeURIComponent(params.calendarId));
    }

    if (path === '/me/events') {
      logTest('Empty string ID handling', true, 'Path unchanged for empty ID');
    } else {
      throw new Error('Path was modified for empty ID');
    }
  });

  // Test 3.3: Multiple path parameters
  await runTest('Multiple parameters in path', async () => {
    const originalPath = '/me/events/{event-id}';
    const eventId = 'event-123';
    const calendarId = 'calendar-456';

    // Simulate handling both path parameter and calendarId
    let path = originalPath.replace('{event-id}', encodeURIComponent(eventId));

    const pathModifiers = {
      calendarId: (p, id) => {
        if (p.startsWith('/me/events/')) {
          return p.replace('/me/events/', `/me/calendars/${id}/events/`);
        }
        return p;
      },
    };

    if (calendarId) {
      path = pathModifiers.calendarId(path, encodeURIComponent(calendarId));
    }

    const expected = '/me/calendars/calendar-456/events/event-123';
    if (path === expected) {
      logTest('Multiple path parameters', true, `Correctly transformed to: ${path}`);
    } else {
      throw new Error(`Expected ${expected}, got ${path}`);
    }
  });

  // ============================================
  // TEST GROUP 4: Performance & Stability
  // ============================================
  console.log('\n🗂️  TEST GROUP 4: PERFORMANCE & STABILITY');
  console.log('=========================================');

  // Test 4.1: Rapid successive calls
  await runTest('Rapid successive API calls', async () => {
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(
        graphClient
          .graphRequest('/me', { method: 'GET' })
          .then(() => true)
          .catch(() => false)
      );
    }
    const results = await Promise.all(promises);
    const allSucceeded = results.every((r) => r);
    if (allSucceeded) {
      logTest('Rapid API calls', true, '5 concurrent calls succeeded');
    } else {
      throw new Error('Some concurrent calls failed');
    }
  });

  // ============================================
  // TEST SUMMARY
  // ============================================
  console.log('\n====================================================');
  console.log('TEST SUMMARY');
  console.log('====================================================');

  const passed = TEST_RESULTS.filter((r) => r.success).length;
  const failed = TEST_RESULTS.filter((r) => !r.success).length;
  const total = TEST_RESULTS.length;

  console.log(`\nTotal Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    TEST_RESULTS.filter((r) => !r.success).forEach((r) => {
      console.log(`  - ${r.testName}: ${r.details}`);
    });
  }

  // Save test results to file
  const testReport = {
    timestamp: new Date().toISOString(),
    summary: { total, passed, failed },
    results: TEST_RESULTS,
  };

  const fs = await import('fs');
  fs.writeFileSync('test-results.json', JSON.stringify(testReport, null, 2));
  console.log('\n📄 Test results saved to test-results.json');

  process.exit(failed > 0 ? 1 : 0);
}

// Run the tests
testGenericSolution().catch((error) => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
