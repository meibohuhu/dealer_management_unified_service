export interface User {
  id: number;
  email?: string;
  wechat_id: string;
  name?: string;
  phone?: string;
  role: string;
  hashed_password?: string;
  is_active: boolean;
  created_at: Date;
}

export interface UserCreate {
  email?: string;
  wechat_id: string;
  name?: string;
  phone?: string;
  role?: string;
  hashed_password?: string;
  is_active?: boolean;
}

export interface UserUpdate {
  email?: string;
  wechat_id?: string;
  name?: string;
  phone?: string;
  role?: string;
  hashed_password?: string;
  is_active?: boolean;
}
