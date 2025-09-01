import { Vehicle } from './Vehicle';
import { Customer } from './Customer';
import { ContractImage } from './ContractImage';

export interface Contract {
  id: number;
  contract_number: string;
  vehicle_id: number;
  customer_id: number;
  vin_number: string;
  customer_name: string;
  customer_phone: string;
  start_date: Date;
  end_date: Date;
  payment_amount: number;
  tax_amount: number;
  deposit_amount: number;
  status: string;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ContractCreate {
  contract_number: string;
  vehicle_id: number;
  customer_id: number;
  vin_number: string;
  customer_name: string;
  customer_phone: string;
  start_date: Date;
  end_date: Date;
  payment_amount: number;
  tax_amount: number;
  deposit_amount: number;
  status?: string;
  created_by?: string;
}

export interface ContractUpdate {
  contract_number?: string;
  vehicle_id?: number;
  customer_id?: number;
  vin_number?: string;
  customer_name?: string;
  customer_phone?: string;
  start_date?: Date;
  end_date?: Date;
  payment_amount?: number;
  tax_amount?: number;
  deposit_amount?: number;
  status?: string;
  created_by?: string;
}

export interface ContractDetailResponse extends Contract {
  images: ContractImage[];
  vehicle: Vehicle;
  customer: Customer;
}
