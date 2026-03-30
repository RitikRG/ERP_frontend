export interface User {
  _id: string;
  id: string;
  org_id: string;
  name?: string;
  email: string;
  type?: 'owner' | 'delivery_agent';
  phone?: string;
  isActive?: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  org?: any;
}
