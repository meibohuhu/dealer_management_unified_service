import { Pool } from 'pg';
import { Database } from 'sqlite3';
import { Customer, CustomerCreate, CustomerUpdate } from '../models/Customer';
import { pgPool, getSqliteDb } from '../config/database';

export class CustomerService {
  private db: Pool | Database;
  private usePostgres: boolean;

  constructor(usePostgres: boolean = true) {
    this.usePostgres = usePostgres;
    this.db = usePostgres ? pgPool : getSqliteDb();
  }

  async getAllCustomers(): Promise<Customer[]> {
    if (this.usePostgres) {
      const query = 'SELECT * FROM ds_customer ORDER BY created_at DESC';
      const result = await (this.db as Pool).query(query);
      return result.rows;
    } else {
      const db = this.db as Database;
      return new Promise((resolve, reject) => {
        db.all('SELECT * FROM ds_customer ORDER BY created_at DESC', (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows as Customer[]);
          }
        });
      });
    }
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    if (this.usePostgres) {
      const query = 'SELECT * FROM ds_customer WHERE id = $1';
      const result = await (this.db as Pool).query(query, [id]);
      return result.rows[0] || null;
    } else {
      const db = this.db as Database;
      return new Promise((resolve, reject) => {
        db.get('SELECT * FROM ds_customer WHERE id = ?', [id], (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row as Customer || null);
          }
        });
      });
    }
  }

  async getCustomerByPhone(phone: string): Promise<Customer | null> {
    if (this.usePostgres) {
      const query = 'SELECT * FROM ds_customer WHERE phone_number = $1';
      const result = await (this.db as Pool).query(query, [phone]);
      return result.rows[0] || null;
    } else {
      const db = this.db as Database;
      return new Promise((resolve, reject) => {
        db.get('SELECT * FROM ds_customer WHERE phone_number = ?', [phone], (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row as Customer || null);
          }
        });
      });
    }
  }

  async searchCustomersByName(name: string): Promise<Customer[]> {
    if (this.usePostgres) {
      const query = `
        SELECT * FROM ds_customer 
        WHERE LOWER(first_name) LIKE LOWER($1) OR LOWER(last_name) LIKE LOWER($1)
        ORDER BY created_at DESC
      `;
      const result = await (this.db as Pool).query(query, [`%${name}%`]);
      return result.rows;
    } else {
      const db = this.db as Database;
      return new Promise((resolve, reject) => {
        const query = `
          SELECT * FROM ds_customer 
          WHERE LOWER(first_name) LIKE LOWER(?) OR LOWER(last_name) LIKE LOWER(?)
          ORDER BY created_at DESC
        `;
        db.all(query, [`%${name}%`, `%${name}%`], (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows as Customer[]);
          }
        });
      });
    }
  }

  async createCustomer(customerData: CustomerCreate): Promise<Customer> {
    if (this.usePostgres) {
      const query = `
        INSERT INTO ds_customer (
          first_name, last_name, phone_number, email, address, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const values = [
        customerData.first_name,
        customerData.last_name,
        customerData.phone_number,
        customerData.email || null,
        customerData.address || null,
        new Date(),
        new Date()
      ];

      const result = await (this.db as Pool).query(query, values);
      return result.rows[0];
    } else {
      const db = this.db as Database;
      return new Promise((resolve, reject) => {
        const query = `
          INSERT INTO ds_customer (
            first_name, last_name, phone_number, email, address, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        const values = [
          customerData.first_name,
          customerData.last_name,
          customerData.phone_number,
          customerData.email || null,
          customerData.address || null,
          new Date().toISOString(),
          new Date().toISOString()
        ];

        db.run(query, values, function(err) {
          if (err) {
            reject(err);
          } else {
            // Fetch the created customer
            db.get('SELECT * FROM ds_customer WHERE id = ?', [this.lastID], (err, row) => {
              if (err) {
                reject(err);
              } else {
                resolve(row as Customer);
              }
            });
          }
        });
      });
    }
  }

  async updateCustomer(id: string, customerData: CustomerUpdate): Promise<Customer | null> {
    if (this.usePostgres) {
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (customerData.first_name !== undefined) {
        updateFields.push(`first_name = $${paramCount++}`);
        values.push(customerData.first_name);
      }
      if (customerData.last_name !== undefined) {
        updateFields.push(`last_name = $${paramCount++}`);
        values.push(customerData.last_name);
      }
      if (customerData.phone_number !== undefined) {
        updateFields.push(`phone_number = $${paramCount++}`);
        values.push(customerData.phone_number);
      }
      if (customerData.email !== undefined) {
        updateFields.push(`email = $${paramCount++}`);
        values.push(customerData.email);
      }
      if (customerData.address !== undefined) {
        updateFields.push(`address = $${paramCount++}`);
        values.push(customerData.address);
      }

      updateFields.push(`updated_at = $${paramCount++}`);
      values.push(new Date());
      values.push(id);

      const query = `
        UPDATE ds_customer 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await (this.db as Pool).query(query, values);
      return result.rows[0] || null;
    } else {
      const db = this.db as Database;
      return new Promise((resolve, reject) => {
        const updateFields: string[] = [];
        const values: any[] = [];

        if (customerData.first_name !== undefined) {
          updateFields.push('first_name = ?');
          values.push(customerData.first_name);
        }
        if (customerData.last_name !== undefined) {
          updateFields.push('last_name = ?');
          values.push(customerData.last_name);
        }
        if (customerData.phone_number !== undefined) {
          updateFields.push('phone_number = ?');
          values.push(customerData.phone_number);
        }
        if (customerData.email !== undefined) {
          updateFields.push('email = ?');
          values.push(customerData.email);
        }
        if (customerData.address !== undefined) {
          updateFields.push('address = ?');
          values.push(customerData.address);
        }

        updateFields.push('updated_at = ?');
        values.push(new Date().toISOString());
        values.push(id);

        const query = `
          UPDATE ds_customer 
          SET ${updateFields.join(', ')}
          WHERE id = ?
        `;

        db.run(query, values, function(err) {
          if (err) {
            reject(err);
          } else {
            if (this.changes > 0) {
              // Fetch the updated customer
              db.get('SELECT * FROM ds_customer WHERE id = ?', [id], (err, row) => {
                if (err) {
                  reject(err);
                } else {
                  resolve(row as Customer);
                }
              });
            } else {
              resolve(null);
            }
          }
        });
      });
    }
  }

  async deleteCustomer(id: string): Promise<boolean> {
    if (this.usePostgres) {
      const query = 'DELETE FROM ds_customer WHERE id = $1';
      const result = await (this.db as Pool).query(query, [id]);
      return result.rowCount > 0;
    } else {
      const db = this.db as Database;
      return new Promise((resolve, reject) => {
        db.run('DELETE FROM ds_customer WHERE id = ?', [id], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes > 0);
          }
        });
      });
    }
  }
}
