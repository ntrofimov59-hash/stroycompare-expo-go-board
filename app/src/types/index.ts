export type Region = {
  id: string;
  name: string;
  slug: string;
  parent_id?: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  unit: string;
  type: string; // material | service
  is_active: boolean;
  image_url?: string;
  category_id: string;
  category?: Category;
  images?: ProductImage[];
  offers?: Offer[];
};

export type ProductImage = {
  id: string;
  product_id: string;
  url: string;
  sort_order: number;
  is_main: boolean;
};

export type Category = {
  id: string;
  parent_id?: string;
  name: string;
  slug: string;
  type: string;
  sort_order: number;
  is_active: boolean;
  children?: Category[];
};

export type Supplier = {
  id: string;
  user_id: string;
  company_name: string;
  inn?: string;
  description?: string;
  phone?: string;
  logo_url?: string;
  rating: number;
  reviews_count: number;
  is_verified: boolean;
};

export type Offer = {
  id: string;
  product_id: string;
  supplier_id: string;
  region_id: string;
  price: number;
  currency: string;
  min_order_qty: number;
  stock_qty?: number;
  delivery_days?: number;
  supports_discount: boolean;
  is_active: boolean;
  valid_until?: string;
  supplier?: Supplier;
  region?: { id: string; name: string; slug: string };
  final_price?: number;
  discount_percent?: number;
};

export type Listing = {
  id: string;
  user_id: string;
  region_id?: string;
  title: string;
  description?: string;
  price?: number;
  currency: string;
  type: string;
  status: string;
  contact_phone?: string;
  image_url?: string;
  created_at: string;
};

export type User = {
  id: string;
  email?: string;
  phone?: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  supplier?: Supplier;
};