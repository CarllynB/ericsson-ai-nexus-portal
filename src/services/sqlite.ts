import initSqlJs, { Database } from 'sql.js';
import { Agent } from './api';

class SQLiteService {
  public db: Database | null = null;
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = this.doInitialize();
    return this.initializationPromise;
  }

  private async doInitialize(): Promise<void> {
    try {
      console.log('🔄 Starting SQLite initialization...');
      
      // Try to load SQL.js with fallback
      let SQL;
      try {
        SQL = await initSqlJs({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/sql.js@1.8.0/dist/${file}`
        });
      } catch (error) {
        console.warn('Failed to load from CDN, trying alternative:', error);
        SQL = await initSqlJs();
      }
      
      console.log('✅ SQL.js loaded successfully');

      // Try to load existing database from localStorage for persistence
      const savedDb = localStorage.getItem('sqlite_database');
      if (savedDb) {
        try {
          console.log('🔄 Loading existing database with persistent data...');
          const uint8Array = new Uint8Array(JSON.parse(savedDb));
          this.db = new SQL.Database(uint8Array);
          console.log('✅ Successfully loaded existing database with all saved data');
          
          // Verify and update tables
          await this.verifyAndUpdateTables();
        } catch (error) {
          console.warn('⚠️ Failed to load saved database, creating new empty one:', error);
          this.db = new SQL.Database();
          this.createTables();
        }
      } else {
        console.log('🆕 No existing database found, creating completely empty database...');
        this.db = new SQL.Database();
        this.createTables();
      }

      this.initialized = true;
      console.log('🎉 SQLite database initialized - all data will persist permanently');
    } catch (error) {
      console.error('❌ Failed to initialize SQLite:', error);
      this.initialized = false;
      this.initializationPromise = null;
      throw error;
    }
  }

  private async verifyAndUpdateTables(): Promise<void> {
    if (!this.db) return;

    try {
      // Check if tables exist and have correct structure
      const tables = this.db.exec("SELECT name FROM sqlite_master WHERE type='table'");
      const tableNames = tables.length > 0 ? tables[0].values.map(row => row[0]) : [];
      console.log('📋 Existing tables:', tableNames);
      
      if (!tableNames.includes('agents') || !tableNames.includes('user_roles') || !tableNames.includes('dashboard_settings')) {
        console.log('⚠️ Required tables missing, recreating...');
        this.createTables();
        return;
      }

      // Check if user_roles table has the updated_at column
      try {
        const columnCheck = this.db.exec("PRAGMA table_info(user_roles)");
        const columns = columnCheck.length > 0 ? columnCheck[0].values.map(row => row[1]) : [];
        
        if (!columns.includes('updated_at')) {
          console.log('⚠️ Adding missing updated_at column to user_roles table...');
          this.db.exec(`
            ALTER TABLE user_roles 
            ADD COLUMN updated_at TEXT DEFAULT (datetime('now'))
          `);
          this.saveDatabase();
          console.log('✅ Added updated_at column successfully');
        }
      } catch (error) {
        console.warn('⚠️ Error checking/updating table structure, recreating tables:', error);
        this.createTables();
      }
    } catch (error) {
      console.error('❌ Error verifying tables:', error);
      this.createTables();
    }
  }

  private createTables(): void {
    if (!this.db) {
      console.error('❌ Database not available for table creation');
      return;
    }

    try {
      console.log('🔄 Creating empty database tables...');
      
      // Create agents table - completely empty
      this.db.exec(`
        DROP TABLE IF EXISTS agents;
        CREATE TABLE agents (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          category TEXT NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'coming_soon')),
          key_features TEXT NOT NULL,
          access_link TEXT,
          contact_info TEXT,
          owner TEXT NOT NULL,
          last_updated TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
      `);

      // Create user_roles table with updated_at column
      this.db.exec(`
        DROP TABLE IF EXISTS user_roles;
        CREATE TABLE user_roles (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'viewer')),
          assigned_at TEXT NOT NULL,
          assigned_by TEXT,
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `);

      // Create dashboard_settings table
      this.db.exec(`
        DROP TABLE IF EXISTS dashboard_settings;
        CREATE TABLE dashboard_settings (
          id INTEGER PRIMARY KEY DEFAULT 1,
          dashboard_url TEXT,
          updated_by TEXT,
          updated_at TEXT DEFAULT (datetime('now')),
          created_at TEXT DEFAULT (datetime('now'))
        );
      `);

      // Insert default dashboard setting
      this.db.exec(`
        INSERT OR IGNORE INTO dashboard_settings (id, dashboard_url, created_at) 
        VALUES (1, NULL, datetime('now'));
      `);

      this.saveDatabase();
      console.log('✅ Empty database tables created and saved successfully');
      console.log('ℹ️ Database is completely empty - no agents exist until created by Super Admins');
      console.log('💾 All future data will persist permanently across all sessions');
    } catch (error) {
      console.error('❌ Error creating tables:', error);
      throw error;
    }
  }

  private saveDatabase(): void {
    if (!this.db) {
      console.warn('⚠️ No database to save');
      return;
    }

    try {
      const data = this.db.export();
      const dataArray = Array.from(data);
      localStorage.setItem('sqlite_database', JSON.stringify(dataArray));
      console.log('💾 Database saved permanently to localStorage - data will persist across sessions');
    } catch (error) {
      console.error('❌ Failed to save database:', error);
    }
  }

  async getAgents(): Promise<Agent[]> {
    await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    try {
      console.log('🔍 Querying agents from SQLite database...');
      const stmt = this.db.prepare('SELECT * FROM agents ORDER BY last_updated DESC');
      const results = [];

      while (stmt.step()) {
        const row = stmt.getAsObject();
        results.push({
          id: row.id as string,
          name: row.name as string,
          description: row.description as string,
          category: row.category as string,
          status: row.status as 'active' | 'inactive' | 'coming_soon',
          key_features: JSON.parse(row.key_features as string),
          access_link: row.access_link as string || undefined,
          contact_info: row.contact_info ? JSON.parse(row.contact_info as string) : undefined,
          owner: row.owner as string,
          last_updated: row.last_updated as string,
          created_at: row.created_at as string,
        });
      }

      stmt.free();
      
      if (results.length === 0) {
        console.log('ℹ️ No agents found in database - database is empty as expected');
      } else {
        console.log(`✅ Successfully retrieved ${results.length} agents from persistent database`);
      }
      
      return results;
    } catch (error) {
      console.error('❌ Error fetching agents from SQLite:', error);
      throw error;
    }
  }

  async createAgent(agent: Omit<Agent, 'id' | 'created_at' | 'last_updated'>): Promise<Agent> {
    await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    const newAgent: Agent = {
      ...agent,
      id: agent.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
    };

    try {
      console.log('➕ Creating new agent in persistent SQLite database:', newAgent.name);
      const stmt = this.db.prepare(`
        INSERT INTO agents (id, name, description, category, status, key_features, access_link, contact_info, owner, last_updated, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run([
        newAgent.id,
        newAgent.name,
        newAgent.description,
        newAgent.category,
        newAgent.status,
        JSON.stringify(newAgent.key_features),
        newAgent.access_link || null,
        newAgent.contact_info ? JSON.stringify(newAgent.contact_info) : null,
        newAgent.owner,
        newAgent.last_updated,
        newAgent.created_at,
      ]);

      stmt.free();
      this.saveDatabase();
      console.log('✅ Agent created and saved permanently - will persist across all sessions:', newAgent.name);
      return newAgent;
    } catch (error) {
      console.error('❌ Error creating agent in SQLite:', error);
      throw error;
    }
  }

  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent> {
    await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    const updateData = {
      ...updates,
      last_updated: new Date().toISOString(),
    };

    try {
      // First get the existing agent
      const existingStmt = this.db.prepare('SELECT * FROM agents WHERE id = ?');
      existingStmt.bind([id]);
      
      if (!existingStmt.step()) {
        existingStmt.free();
        throw new Error('Agent not found');
      }

      existingStmt.free();

      // Build update query dynamically
      const updateFields = [];
      const values = [];

      for (const [key, value] of Object.entries(updateData)) {
        if (value !== undefined) {
          updateFields.push(`${key} = ?`);
          if (key === 'key_features' && Array.isArray(value)) {
            values.push(JSON.stringify(value));
          } else if (key === 'contact_info' && value) {
            values.push(JSON.stringify(value));
          } else {
            values.push(value);
          }
        }
      }

      if (updateFields.length > 0) {
        const updateStmt = this.db.prepare(`
          UPDATE agents SET ${updateFields.join(', ')} WHERE id = ?
        `);
        updateStmt.run([...values, id]);
        updateStmt.free();
      }

      this.saveDatabase();
      console.log('✅ Agent updated and saved permanently - changes will persist across all sessions');

      // Return updated agent
      const updatedStmt = this.db.prepare('SELECT * FROM agents WHERE id = ?');
      updatedStmt.bind([id]);
      updatedStmt.step();
      const row = updatedStmt.getAsObject();
      updatedStmt.free();

      return {
        id: row.id as string,
        name: row.name as string,
        description: row.description as string,
        category: row.category as string,
        status: row.status as 'active' | 'inactive' | 'coming_soon',
        key_features: JSON.parse(row.key_features as string),
        access_link: row.access_link as string || undefined,
        contact_info: row.contact_info ? JSON.parse(row.contact_info as string) : undefined,
        owner: row.owner as string,
        last_updated: row.last_updated as string,
        created_at: row.created_at as string,
      };
    } catch (error) {
      console.error('❌ Error updating agent in SQLite:', error);
      throw error;
    }
  }

  async deleteAgent(id: string): Promise<void> {
    await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    try {
      const stmt = this.db.prepare('DELETE FROM agents WHERE id = ?');
      stmt.run([id]);
      stmt.free();
      this.saveDatabase();
      console.log('🗑️ Agent deleted permanently from database - deletion persists across all sessions');
    } catch (error) {
      console.error('❌ Error deleting agent from SQLite:', error);
      throw error;
    }
  }

  // User role management methods - Fixed with proper column handling
  async createUserRole(email: string, role: 'super_admin' | 'admin' | 'viewer', assignedBy?: string): Promise<void> {
    await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    try {
      console.log(`🔄 Creating/updating user role permanently: ${email} -> ${role}`);
      
      const userId = email.replace('@', '_').replace(/\./g, '_');
      const now = new Date().toISOString();
      
      // Check if user already exists using a proper query
      const checkStmt = this.db.prepare('SELECT COUNT(*) as count FROM user_roles WHERE email = ?');
      checkStmt.bind([email]);
      checkStmt.step();
      const countResult = checkStmt.getAsObject();
      const exists = (countResult.count as number) > 0;
      checkStmt.free();
      
      if (exists) {
        // Update existing user
        console.log(`📝 Updating existing user role permanently: ${email}`);
        const updateStmt = this.db.prepare(`
          UPDATE user_roles 
          SET role = ?, updated_at = ?, assigned_by = ?
          WHERE email = ?
        `);
        updateStmt.run([role, now, assignedBy || null, email]);
        updateStmt.free();
        console.log('✅ User role updated permanently');
      } else {
        // Create new user
        console.log(`➕ Creating new user role permanently: ${email}`);
        const insertStmt = this.db.prepare(`
          INSERT INTO user_roles (id, user_id, email, role, assigned_at, assigned_by, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        insertStmt.run([userId, userId, email, role, now, assignedBy || null, now]);
        insertStmt.free();
        console.log('✅ User role created permanently');
      }
      
      this.saveDatabase();
      console.log('💾 Database saved - role assignment will persist across all sessions');
    } catch (error) {
      console.error('❌ Error in createUserRole:', error);
      throw new Error(`Failed to assign role: ${error.message}`);
    }
  }

  async updateUserRole(email: string, newRole: 'super_admin' | 'admin' | 'viewer'): Promise<void> {
    await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    try {
      console.log(`🔄 Updating user role permanently: ${email} -> ${newRole}`);
      
      const now = new Date().toISOString();
      
      // Check if user exists first
      const checkStmt = this.db.prepare('SELECT COUNT(*) as count FROM user_roles WHERE email = ?');
      checkStmt.bind([email]);
      checkStmt.step();
      const countResult = checkStmt.getAsObject();
      const exists = (countResult.count as number) > 0;
      checkStmt.free();
      
      if (!exists) {
        throw new Error(`No user found with email: ${email}`);
      }
      
      // Update the role
      const stmt = this.db.prepare(`
        UPDATE user_roles 
        SET role = ?, updated_at = ? 
        WHERE email = ?
      `);
      stmt.run([newRole, now, email]);
      stmt.free();
      
      this.saveDatabase();
      console.log('✅ User role updated permanently - will persist across all sessions');
    } catch (error) {
      console.error('❌ Error updating user role:', error);
      throw new Error(`Failed to update role: ${error.message}`);
    }
  }

  async getUserRole(email: string): Promise<string | null> {
    await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    try {
      const stmt = this.db.prepare('SELECT role FROM user_roles WHERE email = ?');
      stmt.bind([email]);
      
      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        console.log(`✅ Found persistent role for ${email}:`, row.role);
        return row.role as string;
      }
      
      stmt.free();
      console.log(`ℹ️ No role found for ${email} in persistent database`);
      return null;
    } catch (error) {
      console.error('❌ Error getting user role:', error);
      return null;
    }
  }

  async getAllUserRoles(): Promise<Array<{id: string, email: string, role: string, assigned_at: string}>> {
    await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    try {
      const stmt = this.db.prepare('SELECT * FROM user_roles ORDER BY assigned_at DESC');
      const results = [];

      while (stmt.step()) {
        const row = stmt.getAsObject();
        results.push({
          id: row.id as string,
          email: row.email as string,
          role: row.role as string,
          assigned_at: row.assigned_at as string,
        });
      }

      stmt.free();
      console.log(`✅ Retrieved ${results.length} persistent user roles from database`);
      return results;
    } catch (error) {
      console.error('❌ Error getting all user roles:', error);
      return [];
    }
  }
}

export const sqliteService = new SQLiteService();
