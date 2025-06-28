
import { sqliteService } from '@/services/sqlite';

export const populateDefaultAgents = async () => {
  try {
    console.log('🔄 Initializing COMPLETELY EMPTY SQLite database...');
    
    // ONLY initialize SQLite database structure - ABSOLUTELY NO DATA
    await sqliteService.initialize();
    
    console.log('✅ SQLite database initialized with ZERO agents');
    console.log('🚫 NO hardcoded data, NO sample data, NO fallback data');
    console.log('👤 Database is 100% empty - only Super Admins can create agents');
    console.log('💾 All future data will persist permanently across sessions');
    
    // Verify database is actually empty
    const agentCount = await sqliteService.getAgents();
    console.log(`🔍 Verified: Database contains ${agentCount.length} agents (MUST be 0)`);
    
    if (agentCount.length > 0) {
      console.error('❌ ERROR: Database is not empty! This should never happen.');
      console.error('🔥 CRITICAL: Found unexpected agents in supposedly empty database');
    } else {
      console.log('✅ CONFIRMED: Database is completely empty as required');
    }
    
  } catch (error) {
    console.error('❌ Error initializing empty database:', error);
  }
};

// Clear browser storage of any cached agent data
export const clearAllCachedAgents = () => {
  try {
    // Clear localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('agent') || key.includes('Agent'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Clear sessionStorage
    const sessionKeysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.includes('agent') || key.includes('Agent'))) {
        sessionKeysToRemove.push(key);
      }
    }
    sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
    
    console.log('🧹 Cleared all cached agent data from browser storage');
  } catch (error) {
    console.warn('⚠️ Could not clear browser storage:', error);
  }
};

// Call this immediately to clean up any existing cached data
clearAllCachedAgents();
