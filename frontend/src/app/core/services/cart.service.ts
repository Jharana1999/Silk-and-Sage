import { Injectable, signal, computed } from '@angular/core';
import { Product } from '../models/product.model';
import { Cart, CartItem } from '../models/cart.model';

const CART_STORAGE_KEY = 'ss_cart';
const FREE_SHIPPING_THRESHOLD = 2000;
const SHIPPING_COST = 150;

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly _items = signal<CartItem[]>(this.loadCart());

  readonly items = this._items.asReadonly();

  readonly cart = computed<Cart>(() => {
    const items = this._items();
    const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
    const total = Math.round(subtotal + shipping);
    const item_count = items.reduce((sum, i) => sum + i.quantity, 0);

    return { items, subtotal, shipping_cost: shipping, tax_amount: 0, total, item_count };
  });

  readonly itemCount = computed(() => this.cart().item_count);
  readonly isEmpty = computed(() => this._items().length === 0);

  addItem(product: Product, quantity = 1): void {
    this._items.update(items => {
      const existing = items.find(i => i.product.id === product.id);
      if (existing) {
        const maxQty = Math.min(existing.quantity + quantity, product.stock_quantity);
        return items.map(i =>
          i.product.id === product.id ? { ...i, quantity: maxQty } : i
        );
      }
      return [...items, { product, quantity: Math.min(quantity, product.stock_quantity) }];
    });
    this.persist();
  }

  updateQuantity(productId: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(productId);
      return;
    }
    this._items.update(items =>
      items.map(i => i.product.id === productId ? { ...i, quantity } : i)
    );
    this.persist();
  }

  removeItem(productId: number): void {
    this._items.update(items => items.filter(i => i.product.id !== productId));
    this.persist();
  }

  clear(): void {
    this._items.set([]);
    localStorage.removeItem(CART_STORAGE_KEY);
  }

  private persist(): void {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this._items()));
  }

  private loadCart(): CartItem[] {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}
