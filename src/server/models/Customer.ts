export interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  email?: string;
  address?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CustomerCreate {
  first_name: string;
  last_name: string;
  phone_number: string;
  email?: string;
  address?: string;
}

export interface CustomerUpdate {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  email?: string;
  address?: string;
}
