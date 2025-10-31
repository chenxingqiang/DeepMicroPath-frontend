// Quick Fix Script for Browser Console
// Run this in the browser console (F12 -> Console tab) to reset models

console.log('🔧 EvidenceSeek Quick Fix - Resetting to DeepMicroPath models only...');

// Define DeepMicroPath models
const deepmicropathModels = [
  {
    name: "deepmicropath-auto",
    displayName: "deepmicropath-auto",
    available: true,
    sorted: 1000,
    provider: {
      id: "deepmicropath",
      providerName: "DeepMicroPath",
      providerType: "deepmicropath",
      sorted: 1
    }
  },
  {
    name: "deepmicropath-chat",
    displayName: "deepmicropath-chat", 
    available: true,
    sorted: 1001,
    provider: {
      id: "deepmicropath",
      providerName: "DeepMicroPath",
      providerType: "deepmicropath",
      sorted: 1
    }
  },
  {
    name: "deepmicropath-deepresearch",
    displayName: "deepmicropath-deepresearch",
    available: true,
    sorted: 1002,
    provider: {
      id: "deepmicropath",
      providerName: "DeepMicroPath",
      providerType: "deepmicropath",
      sorted: 1
    }
  },
  {
    name: "deepmicropath-microbiology-report",
    displayName: "deepmicropath-microbiology-report",
    available: true,
    sorted: 1003,
    provider: {
      id: "deepmicropath",
      providerName: "DeepMicroPath",
      providerType: "deepmicropath",
      sorted: 1
    }
  }
];

// Get current config
let config = localStorage.getItem('app-config');
if (config) {
  try {
    config = JSON.parse(config);
    console.log('✓ Found existing config');
    
    // Update models
    config.state.models = deepmicropathModels;
    config.state.modelConfig.model = "deepmicropath-chat";
    config.state.modelConfig.providerName = "DeepMicroPath";
    config.state.customModels = "";
    config.version = 5.0;
    
    // Save back
    localStorage.setItem('app-config', JSON.stringify(config));
    console.log('✓ Updated models to DeepMicroPath only');
    console.log('✓ Set default model to deepmicropath-chat');
  } catch (e) {
    console.error('✗ Error parsing config:', e);
  }
} else {
  console.log('✓ No existing config found - will use defaults');
}

// Get current access config
let access = localStorage.getItem('access-control');
if (access) {
  try {
    access = JSON.parse(access);
    console.log('✓ Found existing access config');
    
    // Reset to DeepMicroPath only
    access.state.provider = "DeepMicroPath";
    access.state.customModels = "";
    access.state.defaultModel = "deepmicropath-chat";
    access.version = 3;
    
    // Save back
    localStorage.setItem('access-control', JSON.stringify(access));
    console.log('✓ Reset access config to DeepMicroPath');
  } catch (e) {
    console.error('✗ Error parsing access config:', e);
  }
}

console.log('');
console.log('✅ Fix complete! Reloading page...');
console.log('');
console.log('After reload, you should see only these 4 models:');
console.log('  • deepmicropath-auto');
console.log('  • deepmicropath-chat (default)');
console.log('  • deepmicropath-deepresearch');
console.log('  • deepmicropath-microbiology-report');
console.log('');

// Reload page
setTimeout(() => {
  location.reload();
}, 1000);
