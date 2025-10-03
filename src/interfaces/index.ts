export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit: number;
  acquireTimeout: number;
  timeout: number;
}

export interface User {
  id?: number;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface Product {
  id?: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  category?: string;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface Order {
  id?: number;
  user_id: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  created_at?: Date;
  updated_at?: Date;
}

export interface OrderItem {
  id?: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}