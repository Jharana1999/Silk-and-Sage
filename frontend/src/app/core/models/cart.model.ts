import { Product } from './product.model';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  shipping_cost: number;
  tax_amount: number;
  total: number;
  item_count: number;
}
