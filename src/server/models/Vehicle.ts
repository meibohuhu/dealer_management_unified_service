export interface Vehicle {
  id: number;
  vin_number: string;
  make: string;
  model: string;
  year: number;
  color: string;
  mileage: number;
  price: number;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface VehicleCreate {
  vin_number: string;
  make: string;
  model: string;
  year?: number;
  color?: string;
  mileage: number;
  price: number;
  status?: string;
}

export interface VehicleUpdate {
  vin_number?: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  mileage?: number;
  price?: number;
  status?: string;
}
