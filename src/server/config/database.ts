import { Pool } from 'pg';
import sqlite3 from 'sqlite3';
import { Database } from 'sqlite3';
import dotenv from 'dotenv';

dotenv.config();

// PostgreSQL configuration
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/dealer_management',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// SQLite configuration (fallback)
let sqliteDb: Database | null = null;

export const initSqlite = (): Promise<Database> => {
  return new Promise((resolve, reject) => {
    sqliteDb = new sqlite3.Database('./dealer_management.db', (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(sqliteDb!);
      }
    });
  });
};

export const getSqliteDb = (): Database => {
  if (!sqliteDb) {
    throw new Error('SQLite database not initialized');
  }
  return sqliteDb;
};

export const closeSqlite = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (sqliteDb) {
      sqliteDb.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
};

export { pgPool };
