# Infinite Scroll Pagination Test Guide

## Testing Steps

1. **Open Browser Console**
   - Open http://localhost:3000 in your browser
   - Open DevTools (F12 or Cmd+Option+I)
   - Go to Console tab

2. **Navigate to Matches Page**
   - Login if needed
   - Click on "Matches" tab
   - You should see console logs:
     ```
     [MatchManagement] Component mounted, fetching initial matches
     [MatchManagement] Fetching matches - Page: 1, Append: false
     [MatchManagement] API Response: {matchCount: 10, pagination: {...}, hasMore: true}
     [MatchManagement] Set initial matches: 10
     [MatchManagement] Setting hasMore to: true
     ```

3. **Scroll Down to Bottom**
   - Scroll down to the bottom of the matches list
   - Watch the console for scroll position logs:
     ```
     [MatchManagement] Scroll position: {
       scrollTop: ...,
       clientHeight: ...,
       scrollHeight: ...,
       distanceFromBottom: ...
     }
     ```

4. **Verify Pagination Triggers**
   - When you're 300px from bottom, you should see:
     ```
     [MatchManagement] Triggering load more - next page: 2
     [MatchManagement] Fetching matches - Page: 2, Append: true
     [MatchManagement] API Response: {matchCount: 10, pagination: {...}, hasMore: true}
     [MatchManagement] Appended matches. Total now: 20
     ```

5. **Check Network Tab**
   - Go to Network tab in DevTools
   - Filter by "matches"
   - You should see API calls:
     - First: `/api/matches?page=1&limit=10`
     - Second: `/api/matches?page=2&limit=10` (when scrolling)
     - Third: `/api/matches?page=3&limit=10` (when scrolling more)

## Expected Behavior

- Initial load: 10 matches displayed
- Scroll down: Loading indicator appears
- More matches load: Total increases to 20, 30, etc.
- When all matches loaded: "No more matches to load" message appears
- Console shows all state transitions

## Debugging

If pagination doesn't work:
1. Check console for errors
2. Verify `hasMore` is true in API response
3. Check scroll position calculations
4. Verify API is returning correct pagination data
5. Check browser DevTools Network tab for API calls
