# Clear Browser Cache for Model Update

## Issue
After updating the frontend to only use DeepMicroPath models, you may still see old models (OpenAI, Claude, etc.) in the settings page model dropdown.

## Why This Happens
The frontend stores configuration data in the browser's `localStorage`, including the list of available models. When you visit the site again, it loads this cached data.

## Automatic Solution (Recommended)
We've updated the store versions to automatically migrate old data:
- **Config Store**: Version 4.1 → 5.0
- **Access Store**: Version 2 → 3

The frontend will automatically:
1. Clear old model lists
2. Reset to DeepMicroPath models only
3. Set default model to `deepmicropath-chat`
4. Clear all third-party provider configurations

**Just refresh the page** after the update and the migration will run automatically.

## Manual Solution (If Automatic Doesn't Work)

### Option 1: Clear localStorage via Browser Console

1. Open the frontend in your browser
2. Open Developer Tools (F12 or Cmd+Opt+I on Mac)
3. Go to **Console** tab
4. Run these commands:

```javascript
// Clear all EvidenceSeek storage
localStorage.clear();

// Or clear specific keys only
localStorage.removeItem('app-config');
localStorage.removeItem('access-control');
localStorage.removeItem('evidenceseek-store');

// Reload the page
location.reload();
```

### Option 2: Clear via Browser Settings

#### Chrome/Edge
1. Go to Settings → Privacy and security
2. Click "Clear browsing data"
3. Select "Cookies and other site data"
4. Choose time range: "All time"
5. Click "Clear data"

#### Firefox
1. Go to Settings → Privacy & Security
2. Under "Cookies and Site Data", click "Clear Data"
3. Check "Cookies and Site Data"
4. Click "Clear"

#### Safari
1. Go to Preferences → Privacy
2. Click "Manage Website Data"
3. Find your site or click "Remove All"
4. Confirm

### Option 3: Use Incognito/Private Mode

Simply open the frontend in an incognito/private browsing window. This starts with a clean slate.

## Verify the Fix

After clearing cache:

1. Reload the frontend
2. Go to Settings (⚙️ icon)
3. Scroll to "Model" section
4. The dropdown should show **only** these models:
   - ✅ deepmicropath-auto
   - ✅ deepmicropath-chat
   - ✅ deepmicropath-deepresearch
   - ✅ deepmicropath-microbiology-report

## Development Mode

If you're running in development mode (`yarn dev`):

```bash
# Stop the dev server (Ctrl+C)

# Clear node_modules/.cache if it exists
rm -rf node_modules/.cache

# Restart
yarn dev
```

Then clear browser cache as described above.

## Production Build

If you've built for production:

```bash
# Rebuild to ensure latest changes
yarn build

# If using Docker
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Troubleshooting

### Still seeing old models?

1. **Hard Refresh**: 
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

2. **Check localStorage**:
   ```javascript
   // In browser console
   console.log(localStorage.getItem('app-config'));
   console.log(localStorage.getItem('access-control'));
   ```

3. **Force version reset**:
   ```javascript
   // In browser console - force migration by setting old version
   const config = JSON.parse(localStorage.getItem('app-config') || '{}');
   config.version = 4.0;  // Old version
   localStorage.setItem('app-config', JSON.stringify(config));
   location.reload();  // Will trigger migration to 5.0
   ```

4. **Complete reset**:
   ```javascript
   // Nuclear option - clears everything
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```

## For Developers

If you need to bump versions again in the future:

1. Edit `app/store/config.ts`:
   ```typescript
   version: 5.0,  // Increment this
   ```

2. Edit `app/store/access.ts`:
   ```typescript
   version: 3,  // Increment this
   ```

3. Add migration logic if needed:
   ```typescript
   if (version < 5.1) {
     // Your migration code
   }
   ```

## Store Version History

| Version | Date | Changes |
|---------|------|---------|
| 5.0 (config) | 2025-10-29 | Removed all third-party models, kept only DeepMicroPath |
| 3.0 (access) | 2025-10-29 | Reset to DeepMicroPath only configuration |
| 4.1 (config) | Previous | Added compress model config |
| 2.0 (access) | Previous | Token → API key migration |
