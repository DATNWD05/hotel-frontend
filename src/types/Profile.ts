export interface User {
  id: number;
  name: string;
  email: string;
  role_id: number;
  status: string;
  created_at: string;
  avatarUrl?: string;
}

export interface EmployeeFace {
  id: number;
  employee_id: number;
  image_path: string;
  created_at: string;
}

export interface Employee {
  id: number;
  user_id: number;
  MaNV?: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  birthday?: string;
  gender?: string;
  cccd?: string;
  department_id?: number;
  hire_date?: string;
  status?: string;
  user?: User;
  faces?: EmployeeFace[];
}

export interface Department { id: number; name: string; }
export interface Role { id: number; name: string; }