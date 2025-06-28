
// This file is now deprecated - all data comes from SQLite only
// NO hardcoded data, NO localStorage fallbacks, NO mock data

console.log('🚫 fileStorage.ts is deprecated - all data now comes from SQLite');
console.log('📝 This file should not be used for agent storage');

// Export empty functions to prevent breaks, but log warnings
export const fileStorageService = {
  getAgents: () => {
    console.warn('⚠️ fileStorageService.getAgents() is deprecated - use SQLite via offlineApiService');
    return Promise.resolve([]);
  },
  
  saveAgents: () => {
    console.warn('⚠️ fileStorageService.saveAgents() is deprecated - use SQLite via offlineApiService');
    return Promise.resolve();
  },
  
  createAgent: () => {
    console.warn('⚠️ fileStorageService.createAgent() is deprecated - use SQLite via offlineApiService');
    return Promise.resolve({} as any);
  },
  
  updateAgent: () => {
    console.warn('⚠️ fileStorageService.updateAgent() is deprecated - use SQLite via offlineApiService');
    return Promise.resolve({} as any);
  },
  
  deleteAgent: () => {
    console.warn('⚠️ fileStorageService.deleteAgent() is deprecated - use SQLite via offlineApiService');
    return Promise.resolve();
  }
};

// Clear any existing localStorage agent data
try {
  localStorage.removeItem('agents');
  localStorage.removeItem('agentData');
  localStorage.removeItem('ai_agents');
  localStorage.removeItem('stored_agents');
  console.log('🧹 Cleared any existing localStorage agent data');
} catch (error) {
  console.warn('⚠️ Could not clear localStorage:', error);
}
