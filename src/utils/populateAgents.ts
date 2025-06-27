
import { sqliteService } from '@/services/sqlite';

export const populateDefaultAgents = async () => {
  try {
    console.log('🔄 Checking database initialization...');
    
    // Just initialize SQLite without adding any hardcoded agents
    await sqliteService.initialize();
    
    console.log('✅ Database initialized and ready for user-created agents');
    console.log('ℹ️ No default agents will be created - only super admins can add agents');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
  }
};
