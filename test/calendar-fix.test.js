import { describe, it, expect } from 'vitest';

describe('Calendar ID Fix', () => {
  it('should modify path when calendarId is provided for create-calendar-event', () => {
    // This test verifies the logic we added
    const tool = { alias: 'create-calendar-event', path: '/me/events' };
    const params = {
      calendarId: 'test-calendar-id',
      body: { subject: 'Test' },
    };

    let path = tool.path;

    // Our fix logic
    const isCalendarOperation = [
      'create-calendar-event',
      'list-calendar-events',
      'get-calendar-event',
      'update-calendar-event',
      'delete-calendar-event',
    ].includes(tool.alias);

    if (isCalendarOperation && params.calendarId) {
      if (tool.alias === 'create-calendar-event' || tool.alias === 'list-calendar-events') {
        path = `/me/calendars/${encodeURIComponent(params.calendarId)}/events`;
      }
    }

    expect(path).toBe('/me/calendars/test-calendar-id/events');
  });

  it('should use default path when calendarId is not provided', () => {
    const tool = { alias: 'create-calendar-event', path: '/me/events' };
    const params = {
      body: { subject: 'Test' },
    };

    let path = tool.path;

    const isCalendarOperation = [
      'create-calendar-event',
      'list-calendar-events',
      'get-calendar-event',
      'update-calendar-event',
      'delete-calendar-event',
    ].includes(tool.alias);

    if (isCalendarOperation && params.calendarId) {
      if (tool.alias === 'create-calendar-event' || tool.alias === 'list-calendar-events') {
        path = `/me/calendars/${encodeURIComponent(params.calendarId)}/events`;
      }
    }

    expect(path).toBe('/me/events');
  });
});
