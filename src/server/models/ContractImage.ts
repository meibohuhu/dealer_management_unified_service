export interface ContractImage {
  id: number;
  contract_id: number;
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  description?: string;
  uploaded_by?: string;
  image_path: string;
  uploaded_at: Date;
}

export interface ContractImageCreate {
  contract_id: number;
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  description?: string;
  uploaded_by?: string;
}

export interface ContractImageUpdate {
  file_name?: string;
  file_url?: string;
  file_size?: number;
  file_type?: string;
  description?: string;
  uploaded_by?: string;
}

export interface ContractImageResponse extends ContractImage {}
