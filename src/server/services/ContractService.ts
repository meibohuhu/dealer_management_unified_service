import { Pool } from 'pg';
import { Database } from 'sqlite3';
import { Contract, ContractCreate, ContractUpdate, ContractDetailResponse } from '../models/Contract';
import { Vehicle } from '../models/Vehicle';
import { Customer } from '../models/Customer';
import { ContractImage } from '../models/ContractImage';
import { pgPool, getSqliteDb } from '../config/database';

export class ContractService {
  private db: Pool | Database;
  private usePostgres: boolean;

  constructor(usePostgres: boolean = true) {
    this.usePostgres = usePostgres;
    this.db = usePostgres ? pgPool : getSqliteDb();
  }

  async createContract(contractData: ContractCreate): Promise<Contract> {
    if (this.usePostgres) {
      const query = `
        INSERT INTO ds_contract (
          contract_number, vehicle_id, customer_id, vin_number, 
          customer_name, customer_phone, start_date, end_date, 
          payment_amount, deposit_amount, status, created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `;
      
      const values = [
        contractData.contract_number,
        contractData.vehicle_id,
        contractData.customer_id,
        contractData.vin_number,
        contractData.customer_name,
        contractData.customer_phone,
        contractData.start_date,
        contractData.end_date,
        contractData.payment_amount,
        contractData.deposit_amount,
        contractData.status || 'active',
        contractData.created_by,
        new Date(),
        new Date()
      ];

      const result = await (this.db as Pool).query(query, values);
      return result.rows[0];
    } else {
      // SQLite implementation
      const db = this.db as Database;
      return new Promise((resolve, reject) => {
        const query = `
          INSERT INTO ds_contract (
            contract_number, vehicle_id, customer_id, vin_number, 
            customer_name, customer_phone, start_date, end_date, 
            payment_amount, deposit_amount, status, created_by, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const values = [
          contractData.contract_number,
          contractData.vehicle_id,
          contractData.customer_id,
          contractData.vin_number,
          contractData.customer_name,
          contractData.customer_phone,
          contractData.start_date.toISOString(),
          contractData.end_date.toISOString(),
          contractData.payment_amount,
          contractData.deposit_amount,
          contractData.status || 'active',
          contractData.created_by,
          new Date().toISOString(),
          new Date().toISOString()
        ];

        db.run(query, values, function(err) {
          if (err) {
            reject(err);
          } else {
            // Fetch the created contract
            db.get('SELECT * FROM ds_contract WHERE id = ?', [this.lastID], (err, row) => {
              if (err) {
                reject(err);
              } else {
                resolve(row as Contract);
              }
            });
          }
        });
      });
    }
  }

  async getContractById(id: string): Promise<ContractDetailResponse | null> {
    if (this.usePostgres) {
      const query = `
        SELECT c.*, v.*, cust.*
        FROM ds_contract c
        LEFT JOIN ds_vehicle v ON c.vehicle_id = v.id
        LEFT JOIN ds_customer cust ON c.customer_id = cust.id
        WHERE c.id = $1
      `;
      
      const result = await (this.db as Pool).query(query, [id]);
      if (result.rows.length === 0) return null;
      
      const contract = result.rows[0];
      return this.mapToContractDetailResponse(contract);
    } else {
      // SQLite implementation
      const db = this.db as Database;
      return new Promise((resolve, reject) => {
        const query = `
          SELECT c.*, v.*, cust.*
          FROM ds_contract c
          LEFT JOIN ds_vehicle v ON c.vehicle_id = v.id
          LEFT JOIN ds_customer cust ON c.customer_id = cust.id
          WHERE c.id = ?
        `;
        
        db.get(query, [id], (err, row) => {
          if (err) {
            reject(err);
          } else if (!row) {
            resolve(null);
          } else {
            resolve(this.mapToContractDetailResponse(row));
          }
        });
      });
    }
  }

  async getAllContracts(skip: number = 0, limit: number = 100): Promise<Contract[]> {
    if (this.usePostgres) {
      const query = 'SELECT * FROM ds_contract ORDER BY created_at DESC LIMIT $1 OFFSET $2';
      const result = await (this.db as Pool).query(query, [limit, skip]);
      return result.rows;
    } else {
      // SQLite implementation
      const db = this.db as Database;
      return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM ds_contract ORDER BY created_at DESC LIMIT ? OFFSET ?';
        db.all(query, [limit, skip], (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows as Contract[]);
          }
        });
      });
    }
  }

  async updateContract(id: string, updateData: ContractUpdate): Promise<Contract | null> {
    if (this.usePostgres) {
      const fields = Object.keys(updateData).filter(key => updateData[key as keyof ContractUpdate] !== undefined);
      if (fields.length === 0) return null;
      
      const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
      const query = `UPDATE ds_contract SET ${setClause}, updated_at = $1 WHERE id = $${fields.length + 2} RETURNING *`;
      
      const values = [new Date(), ...fields.map(field => updateData[field as keyof ContractUpdate]), id];
      const result = await (this.db as Pool).query(query, values);
      
      return result.rows[0] || null;
    } else {
      // SQLite implementation
      const db = this.db as Database;
      return new Promise((resolve, reject) => {
        const fields = Object.keys(updateData).filter(key => updateData[key as keyof ContractUpdate] !== undefined);
        if (fields.length === 0) {
          resolve(null);
          return;
        }
        
        const setClause = fields.map(field => `${field} = ?`).join(', ');
        const query = `UPDATE ds_contract SET ${setClause}, updated_at = ? WHERE id = ?`;
        
        const values = [...fields.map(field => updateData[field as keyof ContractUpdate]), new Date().toISOString(), id];
        
        db.run(query, values, function(err) {
          if (err) {
            reject(err);
          } else if (this.changes === 0) {
            resolve(null);
          } else {
            // Fetch the updated contract
            db.get('SELECT * FROM ds_contract WHERE id = ?', [id], (err, row) => {
              if (err) {
                reject(err);
              } else {
                resolve(row as Contract);
              }
            });
          }
        });
      });
    }
  }

  async deleteContract(id: string): Promise<boolean> {
    if (this.usePostgres) {
      const result = await (this.db as Pool).query('DELETE FROM ds_contract WHERE id = $1', [id]);
      return (result.rowCount ?? 0) > 0;
    } else {
      // SQLite implementation
      const db = this.db as Database;
      return new Promise((resolve, reject) => {
        db.run('DELETE FROM ds_contract WHERE id = ?', [id], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes > 0);
          }
        });
      });
    }
  }

  private mapToContractDetailResponse(data: any): ContractDetailResponse {
    return {
      id: data.id,
      contract_number: data.contract_number,
      vehicle_id: data.vehicle_id,
      customer_id: data.customer_id,
      vin_number: data.vin_number,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      start_date: new Date(data.start_date),
      end_date: new Date(data.end_date),
      payment_amount: data.payment_amount,
      deposit_amount: data.deposit_amount,
      status: data.status,
      created_by: data.created_by,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
      images: [], // TODO: Implement image fetching
      vehicle: {
        id: data.vehicle_id,
        vin_number: data.vin_number,
        make: data.make,
        model: data.model,
        year: data.year,
        color: data.color,
        mileage: data.mileage,
        price: data.price,
        status: data.vehicle_status,
        created_at: new Date(data.vehicle_created_at || data.created_at),
        updated_at: new Date(data.vehicle_updated_at || data.updated_at)
      },
      customer: {
        id: data.customer_id,
        first_name: data.first_name,
        last_name: data.last_name,
        phone_number: data.phone_number,
        email: data.email,
        address: data.address,
        created_at: new Date(data.customer_created_at || data.created_at),
        updated_at: new Date(data.customer_updated_at || data.updated_at)
      }
    };
  }
}
