export interface Product {
  org_id: string;
  name: string;
  p_code: string;
  img?: string;
  cost: Number;
  price: Number;
  tax_rate: Number;
  tax_type: string;
  cess: Number;
}
