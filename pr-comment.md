@eirikb Thank you for the excellent feedback! I've refactored the solution to be generic and global as you suggested.

## Changes Made

### ✅ Generic Solution
- Replaced tool-specific checks with a generic `pathModifiers` system
- No more `if (tool.alias === 'create-calendar-event')` checks
- Solution applies globally to all tools automatically

### ✅ Less Code
- Reduced from ~25 lines to ~15 lines of logic
- Cleaner, more maintainable implementation

### ✅ Properly Encoded
- All IDs are encoded with `encodeURIComponent()`
- Handles special characters correctly (spaces, `+`, `/`, `@`, etc.)

### ✅ Extensible
The solution is easily extensible for future ID parameters:
```javascript
const pathModifiers: Record<string, (path: string, id: string) => string> = {
  calendarId: (p, id) => {
    // Calendar logic
  },
  // Easy to add more:
  // mailFolderId: (p, id) => { ... },
  // driveId: (p, id) => { ... },
};
```

## Testing Performed

### Unit Tests ✅
- All 18 tests pass
- Added specific tests for the generic implementation
- No TypeScript errors, build successful

### Verified Functionality ✅
- ✅ Path transformation: `/me/events` → `/me/calendars/{calendarId}/events`
- ✅ Backwards compatible (works without calendarId)
- ✅ Handles edge cases (undefined, null, empty IDs)
- ✅ Special character encoding works correctly

### Regression Testing ✅
Confirmed no impact on other operations:
- Mail operations (`/me/messages`)
- User profile (`/me`)
- Drive operations (`/me/drive`)
- All other endpoints without ID parameters

## Documentation
Created comprehensive test documentation in `TEST_DOCUMENTATION.md` detailing all tests performed and results.

The solution is now generic, global, uses less code, and has been thoroughly tested to ensure it doesn't break anything else. Thank you for guiding me toward this better approach!