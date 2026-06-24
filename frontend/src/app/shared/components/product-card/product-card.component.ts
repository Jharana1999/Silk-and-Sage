import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Product } from '../../../core/models/product.model';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { AssetUrlPipe } from '../../pipes/asset-url.pipe';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterLink, CommonModule, AssetUrlPipe],
  template: `
    <div class="card-luxury group relative overflow-hidden bg-white" [class.animate-fade-in]="animated">
      <!-- Badges -->
      <div class="absolute top-4 left-4 z-10 flex flex-col gap-2">
        @if (product.is_new_arrival) {
          <span class="badge-new">New</span>
        }
        @if (product.is_bestseller) {
          <span class="badge-bestseller">Bestseller</span>
        }
        @if (product.discount_percentage > 0) {
          <span class="badge-sale">-{{ product.discount_percentage }}%</span>
        }
      </div>

      <!-- Quick add button -->
      <button
        (click)="addToCart($event)"
        class="absolute top-4 right-4 z-10 w-9 h-9 bg-white shadow-card flex items-center justify-center
               opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0
               transition-all duration-300 hover:bg-sage-600 hover:text-white text-gray-600"
        title="Add to cart"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
      </button>

      <!-- Image -->
      <a [routerLink]="['/products', product.slug]" class="block overflow-hidden aspect-[3/4] bg-cream-100">
        @if (primaryImage) {
          <img
            [src]="primaryImage.url | assetUrl"
            [alt]="primaryImage.alt_text || product.name"
            class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          >
        } @else {
          <div class="w-full h-full flex items-center justify-center bg-cream-200">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-sage-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>
        }
      </a>

      <!-- Info -->
      <div class="p-5">
        @if (product.category) {
          <p class="font-sans text-xs uppercase tracking-widest text-sage-500 mb-2">{{ product.category.name }}</p>
        }
        <a [routerLink]="['/products', product.slug]" class="block">
          <h3 class="font-serif text-lg text-sage-800 leading-snug mb-1 hover:text-sage-600 transition-colors">{{ product.name }}</h3>
        </a>

        @if (product.short_description) {
          <p class="font-sans text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2">{{ product.short_description }}</p>
        }

        <!-- Rating -->
        @if (product.review_count > 0) {
          <div class="flex items-center gap-2 mb-3">
            <div class="stars">
              @for (star of stars; track $index) {
                <svg class="w-3.5 h-3.5" [class.text-gold-400]="$index < fullStars" [class.text-gray-200]="$index >= fullStars" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              }
            </div>
            <span class="font-sans text-xs text-gray-400">({{ product.review_count }})</span>
          </div>
        }

        <!-- Price -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="font-serif text-xl text-sage-700 font-medium">Rs. {{ product.price | number:'1.0-0' }}</span>
            @if (product.compare_at_price) {
              <span class="font-sans text-sm text-gray-400 line-through">Rs. {{ product.compare_at_price | number:'1.0-0' }}</span>
            }
          </div>
          @if (product.stock_quantity === 0) {
            <span class="font-sans text-xs text-red-400">Sold out</span>
          } @else if (product.stock_quantity <= 5) {
            <span class="font-sans text-xs text-gold-600">{{ product.stock_quantity }} left</span>
          }
        </div>
      </div>
    </div>
  `,
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;
  @Input() animated = false;

  private readonly cartService = inject(CartService);
  private readonly toast = inject(ToastService);

  readonly stars = Array(5).fill(0);

  get primaryImage() {
    return this.product.images?.find(img => img.is_primary) ?? this.product.images?.[0];
  }

  get fullStars(): number {
    return Math.round(this.product.average_rating);
  }

  addToCart(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.product.stock_quantity === 0) return;
    this.cartService.addItem(this.product, 1);
    this.toast.success(`${this.product.name} added to cart`);
  }
}
