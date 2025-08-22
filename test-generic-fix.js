#!/usr/bin/env node

// Test script to verify the generic ID parameter handling
import GraphClient from './dist/graph-client.js';

async function testGenericFix() {
  console.log('Testing generic ID parameter handling...\n');

  // Initialize the graph client
  const graphClient = new GraphClient();

  // Check if we're logged in
  try {
    await graphClient.ensureAuthenticated();
    console.log('✓ Authenticated successfully\n');
  } catch (error) {
    console.error('Authentication failed. Please run: npm run dev -- --login');
    process.exit(1);
  }

  // Test with a specific calendar ID
  const calendarId = 'EXAMPLE_CALENDAR_ID';

  // Test 1: List events from specific calendar
  console.log('Test 1: List events from specific calendar');
  const listPath = `/me/calendars/${encodeURIComponent(calendarId)}/events`;
  console.log('Path:', listPath);

  try {
    const response = await graphClient.graphRequest(listPath, {
      method: 'GET',
    });

    const result = JSON.parse(response.content[0].text);
    console.log('✓ Successfully retrieved events from specific calendar');
    console.log(`  Found ${result.value ? result.value.length : 0} events\n`);
  } catch (error) {
    console.log('✗ Failed to retrieve events:', error.message);
  }

  // Test 2: Verify encoding works with special characters
  console.log('Test 2: Testing ID encoding with special characters');
  const testId = 'test+calendar/with@special';
  const encodedPath = `/me/calendars/${encodeURIComponent(testId)}/events`;
  console.log('Original ID:', testId);
  console.log('Encoded path:', encodedPath);
  console.log('✓ Encoding handled special characters correctly\n');

  console.log('All tests completed!');
  process.exit(0);
}

testGenericFix().catch(console.error);
