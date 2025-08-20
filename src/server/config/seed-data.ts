import { Pool } from 'pg';
import { Database } from 'sqlite3';
import { pgPool, getSqliteDb } from './database';

export async function seedSampleData(usePostgres: boolean = true) {
  if (usePostgres) {
    await seedPostgresData();
  } else {
    await seedSQLiteData();
  }
}

async function seedPostgresData() {
  const client = await pgPool.connect();
  
  try {
    // Check if data already exists
    const vehicleCount = await client.query('SELECT COUNT(*) FROM ds_vehicle');
    const customerCount = await client.query('SELECT COUNT(*) FROM ds_customer');
    
    if (vehicleCount.rows[0].count === '0') {
      // Insert sample vehicles
      await client.query(`
        INSERT INTO ds_vehicle (vin_number, make, model, year, color, mileage, price, status, created_at, updated_at) VALUES
        ('1HGBH41JXMN109186', 'Honda', 'Civic', 2021, 'Blue', 15000, 25000.00, 'available', NOW(), NOW()),
        ('2T1BURHE0JC123456', 'Toyota', 'Camry', 2020, 'Silver', 25000, 28000.00, 'available', NOW(), NOW()),
        ('3VWDX7AJ5DM123789', 'Volkswagen', 'Golf', 2019, 'White', 35000, 22000.00, 'available', NOW(), NOW()),
        ('4T1B11HK5JU123456', 'Toyota', 'Corolla', 2022, 'Red', 8000, 30000.00, 'available', NOW(), NOW()),
        ('5NPE34AF5FH123789', 'Hyundai', 'Sonata', 2021, 'Black', 18000, 26000.00, 'available', NOW(), NOW())
      `);
      console.log('Sample vehicles inserted into PostgreSQL');
    }
    
    if ((customerCount.rows[0] as any).count === '0') {
      // Insert sample customers
      await client.query(`
        INSERT INTO ds_customer (first_name, last_name, phone_number, email, address, created_at, updated_at) VALUES
        ('John', 'Smith', '555-0101', 'john.smith@email.com', '123 Main St, Anytown, USA', NOW(), NOW()),
        ('Sarah', 'Johnson', '555-0102', 'sarah.johnson@email.com', '456 Oak Ave, Somewhere, USA', NOW(), NOW()),
        ('Michael', 'Brown', '555-0103', 'michael.brown@email.com', '789 Pine Rd, Elsewhere, USA', NOW(), NOW()),
        ('Emily', 'Davis', '555-0104', 'emily.davis@email.com', '321 Elm St, Nowhere, USA', NOW(), NOW()),
        ('David', 'Wilson', '555-0105', 'david.wilson@email.com', '654 Maple Dr, Anywhere, USA', NOW(), NOW())
      `);
      console.log('Sample customers inserted into PostgreSQL');
    }
  } catch (error) {
    console.error('Error seeding PostgreSQL data:', error);
  } finally {
    client.release();
  }
}

async function seedSQLiteData() {
  const db = getSqliteDb();
  
  return new Promise<void>((resolve, reject) => {
    db.serialize(() => {
      // Check if data already exists
      db.get('SELECT COUNT(*) as count FROM ds_vehicle', (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        
        if ((row as any).count === 0) {
          // Insert sample vehicles
          const vehicleQueries = [
            `INSERT INTO ds_vehicle (vin_number, make, model, year, color, mileage, price, status, created_at, updated_at) VALUES 
             ('1HGBH41JXMN109186', 'Honda', 'Civic', 2021, 'Blue', 15000, 25000.00, 'available', datetime('now'), datetime('now'))`,
            `INSERT INTO ds_vehicle (vin_number, make, model, year, color, mileage, price, status, created_at, updated_at) VALUES 
             ('2T1BURHE0JC123456', 'Toyota', 'Camry', 2020, 'Silver', 25000, 28000.00, 'available', datetime('now'), datetime('now'))`,
            `INSERT INTO ds_vehicle (vin_number, make, model, year, color, mileage, price, status, created_at, updated_at) VALUES 
             ('3VWDX7AJ5DM123789', 'Volkswagen', 'Golf', 2019, 'White', 35000, 22000.00, 'available', datetime('now'), datetime('now'))`,
            `INSERT INTO ds_vehicle (vin_number, make, model, year, color, mileage, price, status, created_at, updated_at) VALUES 
             ('4T1B11HK5JU123456', 'Toyota', 'Corolla', 2022, 'Red', 8000, 30000.00, 'available', datetime('now'), datetime('now'))`,
            `INSERT INTO ds_vehicle (vin_number, make, model, year, color, mileage, price, status, created_at, updated_at) VALUES 
             ('5NPE34AF5FH123789', 'Hyundai', 'Sonata', 2021, 'Black', 18000, 26000.00, 'available', datetime('now'), datetime('now'))`
          ];
          
          vehicleQueries.forEach(query => {
            db.run(query, (err) => {
              if (err) console.error('Error inserting vehicle:', err);
            });
          });
          console.log('Sample vehicles inserted into SQLite');
        }
        
        // Check customers
        db.get('SELECT COUNT(*) as count FROM ds_customer', (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          
          if ((row as any).count === 0) {
            // Insert sample customers
            const customerQueries = [
              `INSERT INTO ds_customer (first_name, last_name, phone_number, email, address, created_at, updated_at) VALUES 
               ('John', 'Smith', '555-0101', 'john.smith@email.com', '123 Main St, Anytown, USA', datetime('now'), datetime('now'))`,
              `INSERT INTO ds_customer (first_name, last_name, phone_number, email, address, created_at, updated_at) VALUES 
               ('Sarah', 'Johnson', '555-0102', 'sarah.johnson@email.com', '456 Oak Ave, Somewhere, USA', datetime('now'), datetime('now'))`,
              `INSERT INTO ds_customer (first_name, last_name, phone_number, email, address, created_at, updated_at) VALUES 
               ('Michael', 'Brown', '555-0103', 'michael.brown@email.com', '789 Pine Rd, Elsewhere, USA', datetime('now'), datetime('now'))`,
              `INSERT INTO ds_customer (first_name, last_name, phone_number, email, address, created_at, updated_at) VALUES 
               ('Emily', 'Davis', '555-0104', 'emily.davis@email.com', '321 Elm St, Nowhere, USA', datetime('now'), datetime('now'))`,
              `INSERT INTO ds_customer (first_name, last_name, phone_number, email, address, created_at, updated_at) VALUES 
               ('David', 'Wilson', '555-0105', 'david.wilson@email.com', '654 Maple Dr, Anywhere, USA', datetime('now'), datetime('now'))`
            ];
            
            customerQueries.forEach(query => {
              db.run(query, (err) => {
                if (err) console.error('Error inserting customer:', err);
              });
            });
            console.log('Sample customers inserted into SQLite');
          }
          
          resolve();
        });
      });
    });
  });
}
