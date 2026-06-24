import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './cart.component.html',
})
export class CartComponent {
  readonly cartService = inject(CartService);
  private readonly toast = inject(ToastService);

  adjustQty(productId: number, delta: number, currentQty: number, maxQty: number): void {
    const newQty = currentQty + delta;
    if (newQty < 1) {
      this.cartService.removeItem(productId);
      this.toast.info('Item removed from cart');
    } else if (newQty > maxQty) {
      this.toast.info(`Only ${maxQty} in stock`);
    } else {
      this.cartService.updateQuantity(productId, newQty);
    }
  }

  removeItem(productId: number): void {
    this.cartService.removeItem(productId);
    this.toast.info('Item removed from cart');
  }

  clearCart(): void {
    this.cartService.clear();
  }
}
