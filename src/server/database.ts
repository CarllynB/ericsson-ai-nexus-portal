
import sqlite3 from 'sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

// Use a shared database file that persists across sessions
const DB_PATH = path.join(process.cwd(), 'shared_database.sqlite');

export const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err);
  } else {
    console.log('📁 Connected to SQLite database at:', DB_PATH);
  }
});

export const setupDatabase = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.serialize(async () => {
      try {
        // Create users table
        db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
          )
        `);

        // Create user_roles table
        db.run(`
          CREATE TABLE IF NOT EXISTS user_roles (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'viewer')),
            assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
            assigned_by TEXT,
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users (id)
          )
        `);

        // Create agents table
        db.run(`
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
          )
        `);

        // Check if we need to seed super admin users (only if users table is empty)
        const userCount = await new Promise<number>((resolveCount) => {
          db.get('SELECT COUNT(*) as count FROM users', (err, row: any) => {
            if (err) resolveCount(0);
            else resolveCount(row.count);
          });
        });

        // Only create default super admin users if database is completely empty
        if (userCount === 0) {
          console.log('📝 Database is empty, creating default super admin users...');
          const superAdmins = ['muhammad.mahmood@ericsson.com', 'carllyn.barfi@ericsson.com'];
          
          for (const email of superAdmins) {
            const userId = email.replace('@', '_').replace(/\./g, '_');
            const defaultPassword = await bcrypt.hash('admin123', 10);
            
            // Insert user
            await new Promise<void>((resolveUser, rejectUser) => {
              db.run(
                'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)',
                [userId, email, defaultPassword],
                (err) => {
                  if (err) rejectUser(err);
                  else resolveUser();
                }
              );
            });

            // Insert role
            await new Promise<void>((resolveRole, rejectRole) => {
              db.run(
                'INSERT INTO user_roles (id, user_id, email, role) VALUES (?, ?, ?, ?)',
                [userId, userId, email, 'super_admin'],
                (err) => {
                  if (err) rejectRole(err);
                  else resolveRole();
                }
              );
            });
          }
          console.log('✅ Default super admin users created');
        } else {
          console.log('ℹ️ Database already contains users, skipping seeding');
        }

        console.log('✅ Database tables created and initialized');
        resolve();
      } catch (error) {
        console.error('❌ Error setting up database:', error);
        reject(error);
      }
    });
  });
};

// Utility function to run database queries with promises
export const dbRun = (query: string, params: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

export const dbGet = (query: string, params: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const dbAll = (query: string, params: any[] = []): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};
