import { Pool } from 'pg';
import { Database } from 'sqlite3';
import { Vehicle, VehicleCreate, VehicleUpdate } from '../models/Vehicle';
import { pgPool, getSqliteDb } from '../config/database';

export class VehicleService {
  private db: Pool | Database;
  private usePostgres: boolean;

  constructor(usePostgres: boolean = true) {
    this.usePostgres = usePostgres;
    this.db = usePostgres ? pgPool : getSqliteDb();
  }

  async getAllVehicles(): Promise<Vehicle[]> {
    if (this.usePostgres) {
      const query = 'SELECT * FROM ds_vehicle ORDER BY created_at DESC';
      const result = await (this.db as Pool).query(query);
      return result.rows;
    } else {
      const db = this.db as Database;
      return new Promise((resolve, reject) => {
        db.all('SELECT * FROM ds_vehicle ORDER BY created_at DESC', (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows as Vehicle[]);
          }
        });
      });
    }
  }

  async getVehicleById(id: string): Promise<Vehicle | null> {
    if (this.usePostgres) {
      const query = 'SELECT * FROM ds_vehicle WHERE id = $1';
      const result = await (this.db as Pool).query(query, [id]);
      return result.rows[0] || null;
    } else {
      const db = this.db as Database;
      return new Promise((resolve, reject) => {
        db.get('SELECT * FROM ds_vehicle WHERE id = ?', [id], (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row as Vehicle || null);
          }
        });
      });
    }
  }

  async getVehicleByVin(vin: string): Promise<Vehicle | null> {
    if (this.usePostgres) {
      const query = 'SELECT * FROM ds_vehicle WHERE vin_number = $1';
      const result = await (this.db as Pool).query(query, [vin]);
      return result.rows[0] || null;
    } else {
      const db = this.db as Database;
      return new Promise((resolve, reject) => {
        db.get('SELECT * FROM ds_vehicle WHERE vin_number = ?', [vin], (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row as Vehicle || null);
          }
        });
      });
    }
  }

  async createVehicle(vehicleData: VehicleCreate): Promise<Vehicle> {
    if (this.usePostgres) {
      const query = `
        INSERT INTO ds_vehicle (
          vin_number, make, model, year, color, mileage, price, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;
      
      const values = [
        vehicleData.vin_number,
        vehicleData.make,
        vehicleData.model,
        vehicleData.year,
        vehicleData.color,
        vehicleData.mileage || 0,
        vehicleData.price || 0,
        vehicleData.status || 'available',
        new Date(),
        new Date()
      ];

      const result = await (this.db as Pool).query(query, values);
      return result.rows[0];
    } else {
      const db = this.db as Database;
      return new Promise((resolve, reject) => {
        const query = `
          INSERT INTO ds_vehicle (
            vin_number, make, model, year, color, mileage, price, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const values = [
          vehicleData.vin_number,
          vehicleData.make,
          vehicleData.model,
          vehicleData.year,
          vehicleData.color,
          vehicleData.mileage || 0,
          vehicleData.price || 0,
          vehicleData.status || 'available',
          new Date().toISOString(),
          new Date().toISOString()
        ];

        db.run(query, values, function(err) {
          if (err) {
            reject(err);
          } else {
            // Fetch the created vehicle
            db.get('SELECT * FROM ds_vehicle WHERE id = ?', [this.lastID], (err, row) => {
              if (err) {
                reject(err);
              } else {
                resolve(row as Vehicle);
              }
            });
          }
        });
      });
    }
  }

  async updateVehicle(id: string, vehicleData: VehicleUpdate): Promise<Vehicle | null> {
    if (this.usePostgres) {
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (vehicleData.vin_number !== undefined) {
        updateFields.push(`vin_number = $${paramCount++}`);
        values.push(vehicleData.vin_number);
      }
      if (vehicleData.make !== undefined) {
        updateFields.push(`make = $${paramCount++}`);
        values.push(vehicleData.make);
      }
      if (vehicleData.model !== undefined) {
        updateFields.push(`model = $${paramCount++}`);
        values.push(vehicleData.model);
      }
      if (vehicleData.year !== undefined) {
        updateFields.push(`year = $${paramCount++}`);
        values.push(vehicleData.year);
      }
      if (vehicleData.color !== undefined) {
        updateFields.push(`color = $${paramCount++}`);
        values.push(vehicleData.color);
      }
      if (vehicleData.mileage !== undefined) {
        updateFields.push(`mileage = $${paramCount++}`);
        values.push(vehicleData.mileage);
      }
      if (vehicleData.price !== undefined) {
        updateFields.push(`price = $${paramCount++}`);
        values.push(vehicleData.price);
      }
      if (vehicleData.status !== undefined) {
        updateFields.push(`status = $${paramCount++}`);
        values.push(vehicleData.status);
      }

      updateFields.push(`updated_at = $${paramCount++}`);
      values.push(new Date());
      values.push(id);

      const query = `
        UPDATE ds_vehicle 
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

        if (vehicleData.vin_number !== undefined) {
          updateFields.push('vin_number = ?');
          values.push(vehicleData.vin_number);
        }
        if (vehicleData.make !== undefined) {
          updateFields.push('make = ?');
          values.push(vehicleData.make);
        }
        if (vehicleData.model !== undefined) {
          updateFields.push('model = ?');
          values.push(vehicleData.model);
        }
        if (vehicleData.year !== undefined) {
          updateFields.push('year = ?');
          values.push(vehicleData.year);
        }
        if (vehicleData.color !== undefined) {
          updateFields.push('color = ?');
          values.push(vehicleData.color);
        }
        if (vehicleData.mileage !== undefined) {
          updateFields.push('mileage = ?');
          values.push(vehicleData.mileage);
        }
        if (vehicleData.price !== undefined) {
          updateFields.push('price = ?');
          values.push(vehicleData.price);
        }
        if (vehicleData.status !== undefined) {
          updateFields.push('status = ?');
          values.push(vehicleData.status);
        }

        updateFields.push('updated_at = ?');
        values.push(new Date().toISOString());
        values.push(id);

        const query = `
          UPDATE ds_vehicle 
          SET ${updateFields.join(', ')}
          WHERE id = ?
        `;

        db.run(query, values, function(err) {
          if (err) {
            reject(err);
          } else {
            if (this.changes > 0) {
              // Fetch the updated vehicle
              db.get('SELECT * FROM ds_vehicle WHERE id = ?', [id], (err, row) => {
                if (err) {
                  reject(err);
                } else {
                  resolve(row as Vehicle);
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

  async deleteVehicle(id: string): Promise<boolean> {
    if (this.usePostgres) {
      const query = 'DELETE FROM ds_vehicle WHERE id = $1';
      const result = await (this.db as Pool).query(query, [id]);
      return (result.rowCount || 0) > 0;
    } else {
      const db = this.db as Database;
      return new Promise((resolve, reject) => {
        db.run('DELETE FROM ds_vehicle WHERE id = ?', [id], function(err) {
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
