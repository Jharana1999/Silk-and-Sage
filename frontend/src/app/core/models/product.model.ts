export interface ProductImage {
  id: number;
  url: string;
  alt_text: string | null;
  is_primary: boolean;
  sort_order: number;
}

export interface ReviewUser {
  id: number;
  full_name: string;
}

export interface ProductReview {
  id: number;
  user: ReviewUser;
  rating: number;
  title: string | null;
  body: string | null;
  is_verified_purchase: boolean;
  created_at: string;
}

export interface CategoryInfo {
  id: number;
  name: string;
  slug: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  price: number;
  compare_at_price: number | null;
  sku: string | null;
  stock_quantity: number;
  category_id: number | null;
  category: CategoryInfo | null;
  is_active: boolean;
  is_featured: boolean;
  is_bestseller: boolean;
  is_new_arrival: boolean;
  ingredients: string | null;
  how_to_use: string | null;
  skin_type: string[] | null;
  tags: string[] | null;
  images: ProductImage[];
  average_rating: number;
  review_count: number;
  discount_percentage: number;
  created_at: string;
  updated_at: string | null;
}

export interface ProductDetail extends Product {
  reviews: ProductReview[];
}

export interface ProductListResponse {
  items: Product[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface ProductFilters {
  page?: number;
  per_page?: number;
  category_slug?: string;
  search?: string;
  min_price?: number;
  max_price?: number;
  is_featured?: boolean;
  is_bestseller?: boolean;
  is_new_arrival?: boolean;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  product_count: number;
  created_at: string;
}

export interface ReviewCreate {
  rating: number;
  title?: string;
  body?: string;
}
