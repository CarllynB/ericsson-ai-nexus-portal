
import { sqliteService } from '@/services/sqlite';

export const clearAllAgents = async () => {
  try {
    console.log('🧹 CLEARING: Deleting all agents from SQLite database...');
    
    await sqliteService.initialize();
    
    // Delete all agents from the database
    const db = (sqliteService as any).db;
    if (db) {
      db.run('DELETE FROM agents');
      console.log('✅ CLEARED: All agents deleted from SQLite database');
      
      // Save the empty database to persist the change
      const data = db.export();
      localStorage.setItem('sqlite-db', JSON.stringify(Array.from(data)));
      console.log('💾 SAVED: Empty database persisted to storage');
    }
    
    // Verify it's empty
    const remainingAgents = await sqliteService.getAgents();
    console.log(`🔍 VERIFICATION: ${remainingAgents.length} agents remaining (should be 0)`);
    
    if (remainingAgents.length === 0) {
      console.log('✅ SUCCESS: Database is now completely empty');
    } else {
      console.error('❌ FAILED: Database still contains agents');
    }
    
    return remainingAgents.length === 0;
  } catch (error) {
    console.error('❌ ERROR: Failed to clear database:', error);
    return false;
  }
};
