# Local Storage Authentication System

## Overview

This application now uses a **local storage-based authentication and database system** instead of Supabase. This means you can connect to the platform with any email and password credentials without needing external authentication services.

## How It Works

### Authentication

- **Any credentials are accepted** - Simply enter any email and password to sign in or sign up
- When you sign in with an email that doesn't exist, a new user account is automatically created
- User sessions are stored in browser's localStorage
- No external authentication service is required

### Database

- All data is stored in your browser's localStorage
- Each user's data is isolated based on their user ID
- Data persists across browser sessions until you clear localStorage
- Supports all the same operations as before:
  - Projects
  - Chapters  
  - Characters
  - Locations
  - Timeline Events
  - User Profiles

## Key Changes

### Files Modified

1. **Created `lib/local-storage.js`** - New authentication and database module
2. **Updated all HTML files** to use `local-storage.js` instead of `supabase.js`:
   - `app.html`
   - `auth/auth.html`
   - `auth/callback.html`
   - `profile.html`
   - `context.html`
   - `index.html`
   - `waitlist.html`

3. **Removed Supabase configuration** from:
   - Environment variable templates
   - HTML meta tags
   - `package.json` dependencies
   - `netlify.toml` configuration

4. **Deleted `lib/supabase.js`** - No longer needed

### API Compatibility

The new local storage system maintains the same API interface as Supabase, so all existing code continues to work without modification:

```javascript
// Authentication
await auth.signIn(email, password)
await auth.signUp(email, password)
await auth.signOut()
await auth.getUser()

// Database operations
await projects.getAll()
await projects.create(title, description)
await chapters.getByProject(projectId)
// ... etc
```

## Usage

### Getting Started

1. Navigate to `/auth/auth.html`
2. Enter any email and password (e.g., `user@example.com` / `password123`)
3. Click "Sign In" or "Sign Up"
4. You'll be automatically authenticated and redirected to the app

### Data Management

- **Viewing data**: Use browser DevTools → Application/Storage → Local Storage
- **Clearing data**: Clear browser localStorage to reset all data
- **Exporting data**: You can manually export localStorage via browser DevTools

### Limitations

- Data is stored per browser/device (not synced across devices)
- Clearing browser data will delete all stored information
- No server-side backup or recovery
- Storage is limited by browser's localStorage quota (typically 5-10MB)

## Development Notes

### Local Storage Keys Used

- `currentUser` - Current authenticated user
- `isAuthenticated` - Authentication status flag
- `users` - All registered users
- `projects` - All projects
- `chapters` - All chapters
- `characters` - All characters
- `locations` - All locations
- `timeline_events` - All timeline events
- `timeline_event_characters` - Character-event relationships
- `character_relationships` - Character relationships
- `profiles` - User profiles

### Security Considerations

⚠️ **Important**: This implementation is designed for local development and testing. For production use:
- Data is stored in plain text in localStorage
- No encryption is applied
- Any JavaScript code can access localStorage
- Not suitable for sensitive data

## Reverting to Supabase

If you need to revert to Supabase:

1. Restore `lib/supabase.js` from git history
2. Update all imports back to `'./lib/supabase.js'`
3. Add Supabase configuration to HTML files
4. Restore `@supabase/supabase-js` dependency in `package.json`
5. Update `netlify.toml` and `env.example` files

## Testing

To test the authentication:

1. Sign up with `test@example.com` / `password`
2. Create a project and add some content
3. Sign out and sign back in with the same credentials
4. Your data should persist

## Support

If you encounter any issues with the local storage system, check:
- Browser console for errors
- Browser DevTools → Application → Local Storage for stored data
- That you're using a modern browser with localStorage support
