export interface User {
  _id: string;
  id: string;
  org_id: string;
  name?: string;
  email: string;
  type?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
  org?: any;
}
