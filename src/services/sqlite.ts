import initSqlJs, { Database } from 'sql.js';
import { Agent } from './api';

class SQLiteService {
  private db: Database | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('Initializing SQLite...');
      const SQL = await initSqlJs({
        locateFile: (file) => `https://sql.js.org/dist/${file}`
      });

      // Try to load existing database from localStorage
      const savedDb = localStorage.getItem('offline_database');
      if (savedDb) {
        try {
          console.log('Attempting to load existing database from localStorage...');
          const uint8Array = new Uint8Array(JSON.parse(savedDb));
          this.db = new SQL.Database(uint8Array);
          console.log('Successfully loaded existing database from localStorage');
          
          // Verify tables exist
          const tables = this.db.exec("SELECT name FROM sqlite_master WHERE type='table'");
          console.log('Existing tables:', tables);
          
          if (!tables.length || !tables[0].values.some(row => row[0] === 'agents')) {
            console.log('Tables missing, recreating...');
            this.createTables();
          }
        } catch (error) {
          console.warn('Failed to load saved database, creating new one:', error);
          this.db = new SQL.Database();
          this.createTables();
        }
      } else {
        console.log('No existing database found, creating new one...');
        this.db = new SQL.Database();
        this.createTables();
      }

      this.initialized = true;
      console.log('SQLite database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SQLite:', error);
      throw error;
    }
  }

  private createTables(): void {
    if (!this.db) return;

    try {
      console.log('Creating database tables...');
      
      // Create agents table matching Supabase schema
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS agents (
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

      // Create user_roles table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS user_roles (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          email TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'viewer',
          assigned_by TEXT,
          assigned_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);

      // Create dashboard_settings table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS dashboard_settings (
          id INTEGER PRIMARY KEY DEFAULT 1,
          dashboard_url TEXT,
          updated_by TEXT,
          updated_at TEXT,
          created_at TEXT
        );
      `);

      this.saveDatabase();
      console.log('Database tables created successfully');
    } catch (error) {
      console.error('Error creating tables:', error);
      throw error;
    }
  }

  private saveDatabase(): void {
    if (!this.db) return;

    try {
      const data = this.db.export();
      const dataArray = Array.from(data);
      localStorage.setItem('offline_database', JSON.stringify(dataArray));
      console.log('Database saved to localStorage');
    } catch (error) {
      console.error('Failed to save database:', error);
    }
  }

  async getAgents(): Promise<Agent[]> {
    if (!this.db) {
      await this.initialize();
    }
    if (!this.db) throw new Error('Database not initialized');

    try {
      console.log('Querying agents from SQLite database...');
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
      console.log(`Successfully retrieved ${results.length} agents from database`);
      return results;
    } catch (error) {
      console.error('Error fetching agents from SQLite:', error);
      throw error;
    }
  }

  async createAgent(agent: Omit<Agent, 'id' | 'created_at' | 'last_updated'>): Promise<Agent> {
    if (!this.db) {
      await this.initialize();
    }
    if (!this.db) throw new Error('Database not initialized');

    const newAgent: Agent = {
      ...agent,
      id: agent.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
    };

    try {
      console.log('Creating new agent in SQLite:', newAgent.name);
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
      console.log('Agent created successfully:', newAgent.name);
      return newAgent;
    } catch (error) {
      console.error('Error creating agent in SQLite:', error);
      throw error;
    }
  }

  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent> {
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

      const existing = existingStmt.getAsObject();
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
      console.error('Error updating agent in SQLite:', error);
      throw error;
    }
  }

  async deleteAgent(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const stmt = this.db.prepare('DELETE FROM agents WHERE id = ?');
      stmt.run([id]);
      stmt.free();
      this.saveDatabase();
    } catch (error) {
      console.error('Error deleting agent from SQLite:', error);
      throw error;
    }
  }

  async syncFromSupabase(agents: Agent[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Clear existing data
      this.db.exec('DELETE FROM agents');

      // Insert new data
      const stmt = this.db.prepare(`
        INSERT INTO agents (id, name, description, category, status, key_features, access_link, contact_info, owner, last_updated, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const agent of agents) {
        stmt.run([
          agent.id,
          agent.name,
          agent.description,
          agent.category,
          agent.status,
          JSON.stringify(agent.key_features),
          agent.access_link || null,
          agent.contact_info ? JSON.stringify(agent.contact_info) : null,
          agent.owner,
          agent.last_updated,
          agent.created_at,
        ]);
      }

      stmt.free();
      this.saveDatabase();
      console.log(`Synced ${agents.length} agents to SQLite`);
    } catch (error) {
      console.error('Error syncing data to SQLite:', error);
      throw error;
    }
  }

  async clearDatabase(): Promise<void> {
    if (!this.db) return;

    try {
      this.db.exec('DELETE FROM agents');
      this.db.exec('DELETE FROM user_roles');
      this.db.exec('DELETE FROM dashboard_settings');
      this.saveDatabase();
      console.log('SQLite database cleared');
    } catch (error) {
      console.error('Error clearing SQLite database:', error);
    }
  }
}

export const sqliteService = new SQLiteService();
