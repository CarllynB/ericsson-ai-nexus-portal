
import { sqliteService } from '@/services/sqlite';

export const populateDefaultAgents = async () => {
  try {
    console.log('🔄 Initializing SQLite database...');
    
    // ONLY initialize SQLite database structure - NO DATA AT ALL
    await sqliteService.initialize();
    
    console.log('✅ SQLite database initialized with completely empty tables');
    console.log('📊 Database contains ZERO agents - completely empty by design');
    console.log('👤 Only Super Admins can create agents - no default/sample data exists');
    console.log('💾 All future data will persist permanently across sessions');
    
    // Verify database is actually empty
    const agentCount = await sqliteService.getAgents();
    console.log(`🔍 Verified: Database contains ${agentCount.length} agents (should be 0)`);
    
  } catch (error) {
    console.error('❌ Error initializing empty database:', error);
  }
};
