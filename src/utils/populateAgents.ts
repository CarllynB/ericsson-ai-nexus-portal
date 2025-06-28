
import { sqliteService } from '@/services/sqlite';

export const populateDefaultAgents = async () => {
  try {
    console.log('🔄 Initializing clean SQLite database...');
    
    // Only initialize SQLite database structure - absolutely no hardcoded data
    await sqliteService.initialize();
    
    console.log('✅ SQLite database initialized with empty tables');
    console.log('ℹ️ Database is completely empty - ready for user-created content only');
    console.log('📝 Only Super Admins can create agents - no default data exists');
    console.log('💾 All data will persist permanently across sessions when created by admins');
  } catch (error) {
    console.error('❌ Error initializing clean database:', error);
  }
};
