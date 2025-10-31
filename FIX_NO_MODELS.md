# Fix: No Models Showing

## Problem
After clearing cache, the model list is empty in the settings page.

## Quick Fix (Copy & Paste)

1. Open the frontend in your browser
2. Press **F12** (or **Cmd+Opt+I** on Mac) to open Developer Tools
3. Go to **Console** tab
4. **Copy and paste** the entire script below:

```javascript
// Quick Fix - Reset to DeepMicroPath models
console.log('🔧 Resetting to DeepMicroPath models...');

const models = [
  {name: "deepmicropath-auto", displayName: "deepmicropath-auto", available: true, sorted: 1000, provider: {id: "deepmicropath", providerName: "DeepMicroPath", providerType: "deepmicropath", sorted: 1}},
  {name: "deepmicropath-chat", displayName: "deepmicropath-chat", available: true, sorted: 1001, provider: {id: "deepmicropath", providerName: "DeepMicroPath", providerType: "deepmicropath", sorted: 1}},
  {name: "deepmicropath-deepresearch", displayName: "deepmicropath-deepresearch", available: true, sorted: 1002, provider: {id: "deepmicropath", providerName: "DeepMicroPath", providerType: "deepmicropath", sorted: 1}},
  {name: "deepmicropath-microbiology-report", displayName: "deepmicropath-microbiology-report", available: true, sorted: 1003, provider: {id: "deepmicropath", providerName: "DeepMicroPath", providerType: "deepmicropath", sorted: 1}}
];

let config = localStorage.getItem('app-config');
if (config) {
  config = JSON.parse(config);
  config.state.models = models;
  config.state.modelConfig.model = "deepmicropath-chat";
  config.state.modelConfig.providerName = "DeepMicroPath";
  config.state.customModels = "";
  config.version = 5.0;
  localStorage.setItem('app-config', JSON.stringify(config));
  console.log('✅ Fixed! Reloading...');
  setTimeout(() => location.reload(), 500);
} else {
  console.log('⚠️ No config found. Refresh page to create new config.');
  setTimeout(() => location.reload(), 500);
}
```

5. Press **Enter**
6. The page will reload automatically
7. Check the settings page - you should now see 4 models

## Alternative: Complete Reset

If the above doesn't work, try a complete reset:

```javascript
// Complete reset
localStorage.clear();
sessionStorage.clear();
console.log('✅ Cleared all storage. Refreshing...');
setTimeout(() => location.reload(), 500);
```

Then:
1. After the page reloads
2. Go to Settings
3. If still no models, run the first script again

## Verify It's Working

After the fix, you should see these models in Settings:
- ✅ deepmicropath-auto
- ✅ deepmicropath-chat (default)
- ✅ deepmicropath-deepresearch  
- ✅ deepmicropath-microbiology-report

## If Still Not Working

1. **Check the dev server is running**:
   ```bash
   cd /Users/xingqiangchen/DeepMicroPath/frontend
   yarn dev
   ```

2. **Check for JavaScript errors** in the Console tab

3. **Try incognito/private mode** - opens with clean state

4. **Hard refresh**:
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

## For Developers

The issue was caused by the migration logic. The fix:

1. Updated `merge()` function in `app/store/config.ts` to preserve migrated models
2. Created manual reset script for immediate fix
3. Models are now properly initialized from `DEFAULT_MODELS` constant

If you need to debug:

```javascript
// Check current config
const config = JSON.parse(localStorage.getItem('app-config'));
console.log('Config version:', config?.version);
console.log('Models:', config?.state?.models);
console.log('Current model:', config?.state?.modelConfig?.model);
```
