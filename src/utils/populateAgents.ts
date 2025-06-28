
import { sqliteService } from '@/services/sqlite';

export const populateDefaultAgents = async () => {
  try {
    console.log('🔄 Initializing clean SQLite database...');
    
    // Only initialize SQLite database structure - no hardcoded data
    await sqliteService.initialize();
    
    console.log('✅ SQLite database initialized with empty tables');
    console.log('ℹ️ Database is ready for user-created content only');
    console.log('📝 Only Super Admins can create agents - no default data loaded');
  } catch (error) {
    console.error('❌ Error initializing clean database:', error);
  }
};
