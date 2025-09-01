import { Pool } from 'pg';
import { Database } from 'sqlite3';
import { pgPool, initSqlite, getSqliteDb } from './database.js';

export async function initializeDatabase(usePostgres: boolean = true) {
  if (usePostgres) {
    await initializePostgres();
  } else {
    await initializeSQLite();
  }
}

async function initializePostgres() {
  const client = await pgPool.connect();
  
  try {
    // Create tables if they don't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS ds_user (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE,
        wechat_id VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        phone VARCHAR(50),
        role VARCHAR(50) DEFAULT 'user',
        hashed_password VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS ds_vehicle (
        id SERIAL PRIMARY KEY,
        vin_number VARCHAR(17) UNIQUE NOT NULL,
        make VARCHAR(100) NOT NULL,
        model VARCHAR(100) NOT NULL,
        year INTEGER NOT NULL,
        color VARCHAR(50) NOT NULL,
        mileage INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add missing columns if they don't exist (for existing tables)
    try {
      await client.query('ALTER TABLE ds_vehicle ADD COLUMN IF NOT EXISTS mileage INTEGER DEFAULT 0');
    } catch (error) {
      console.log('mileage column already exists or could not be added');
    }
    
    try {
      await client.query('ALTER TABLE ds_vehicle ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0');
    } catch (error) {
      console.log('price column already exists or could not be added');
    }
    
    try {
      await client.query('ALTER TABLE ds_vehicle ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT \'available\'');
    } catch (error) {
      console.log('status column already exists or could not be added');
    }
    
    try {
      await client.query('ALTER TABLE ds_vehicle ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    } catch (error) {
      console.log('updated_at column already exists or could not be added');
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS ds_customer (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone_number VARCHAR(50) NOT NULL,
        email VARCHAR(255),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add missing columns to customer table if they don't exist
    try {
      await client.query('ALTER TABLE ds_customer ADD COLUMN IF NOT EXISTS address TEXT');
    } catch (error) {
      console.log('address column already exists or could not be added');
    }
    
    try {
      await client.query('ALTER TABLE ds_customer ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    } catch (error) {
      console.log('updated_at column already exists or could not be added');
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS ds_contract (
        id SERIAL PRIMARY KEY,
        contract_number VARCHAR(100) UNIQUE NOT NULL,
        vehicle_id INTEGER NOT NULL REFERENCES ds_vehicle(id),
        customer_id INTEGER NOT NULL REFERENCES ds_customer(id),
        vin_number VARCHAR(17) NOT NULL,
        customer_name VARCHAR(200) NOT NULL,
        customer_phone VARCHAR(50) NOT NULL,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        payment_amount DECIMAL(10,2) NOT NULL,
        tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        deposit_amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        created_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add tax_amount column if it doesn't exist
    try {
      await client.query('ALTER TABLE ds_contract ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0');
    } catch (error) {
      console.log('tax_amount column already exists or could not be added');
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS ds_contract_image (
        id SERIAL PRIMARY KEY,
        contract_id INTEGER NOT NULL REFERENCES ds_contract(id) ON DELETE CASCADE,
        file_name VARCHAR(255) NOT NULL,
        file_url TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        file_type VARCHAR(100) NOT NULL,
        description TEXT,
        uploaded_by VARCHAR(100),
        image_path TEXT NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('PostgreSQL tables initialized successfully');
  } catch (error) {
    console.error('Error initializing PostgreSQL:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function initializeSQLite() {
  await initSqlite();
  const db = getSqliteDb();
  
  return new Promise<void>((resolve, reject) => {
    db.serialize(() => {
      // Create tables
      db.run(`
        CREATE TABLE IF NOT EXISTS ds_user (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE,
          wechat_id TEXT UNIQUE NOT NULL,
          name TEXT,
          phone TEXT,
          role TEXT DEFAULT 'user',
          hashed_password TEXT,
          is_active INTEGER DEFAULT 1,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS ds_vehicle (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          vin_number TEXT UNIQUE NOT NULL,
          make TEXT NOT NULL,
          model TEXT NOT NULL,
          year INTEGER NOT NULL,
          color TEXT NOT NULL,
          mileage INTEGER NOT NULL,
          price REAL NOT NULL,
          status TEXT DEFAULT 'available',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS ds_customer (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          phone_number TEXT NOT NULL,
          email TEXT,
          address TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS ds_contract (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          contract_number TEXT UNIQUE NOT NULL,
          vehicle_id INTEGER NOT NULL,
          customer_id INTEGER NOT NULL,
          vin_number TEXT NOT NULL,
          customer_name TEXT NOT NULL,
          customer_phone TEXT NOT NULL,
          start_date TEXT NOT NULL,
          end_date TEXT NOT NULL,
          payment_amount REAL NOT NULL,
          tax_amount REAL NOT NULL DEFAULT 0,
          deposit_amount REAL NOT NULL,
          status TEXT DEFAULT 'active',
          created_by TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (vehicle_id) REFERENCES ds_vehicle(id),
          FOREIGN KEY (customer_id) REFERENCES ds_customer(id)
        )
      `);

      // Add tax_amount column if it doesn't exist for SQLite
      db.run('ALTER TABLE ds_contract ADD COLUMN tax_amount REAL DEFAULT 0', (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.log('tax_amount column already exists or could not be added');
        }
      });

      db.run(`
        CREATE TABLE IF NOT EXISTS ds_contract_image (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          contract_id INTEGER NOT NULL,
          file_name TEXT NOT NULL,
          file_url TEXT NOT NULL,
          file_size INTEGER NOT NULL,
          file_type TEXT NOT NULL,
          description TEXT,
          uploaded_by TEXT,
          image_path TEXT NOT NULL,
          uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (contract_id) REFERENCES ds_contract(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('SQLite tables initialized successfully');
          resolve();
        }
      });
    });
  });
}
