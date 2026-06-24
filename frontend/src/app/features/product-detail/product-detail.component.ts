import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ProductDetail, ProductReview, ReviewCreate } from '../../core/models/product.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './product-detail.component.html',
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);
  private readonly toast = inject(ToastService);

  readonly auth = inject(AuthService);

  product = signal<ProductDetail | null>(null);
  loading = signal(true);
  selectedImage = signal<string | null>(null);
  quantity = signal(1);
  activeTab = signal<'description' | 'ingredients' | 'reviews'>('description');
  addingToCart = signal(false);

  reviewForm: ReviewCreate = { rating: 5, title: '', body: '' };
  submittingReview = signal(false);

  readonly stars = Array(5).fill(0);

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug')!;
      this.loadProduct(slug);
    });
  }

  loadProduct(slug: string): void {
    this.loading.set(true);
    this.productService.getProductBySlug(slug).subscribe({
      next: product => {
        this.product.set(product);
        const primary = product.images.find(img => img.is_primary) ?? product.images[0];
        this.selectedImage.set(primary?.url ?? null);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Product not found');
        this.loading.set(false);
      },
    });
  }

  adjustQty(delta: number): void {
    const product = this.product();
    if (!product) return;
    const newQty = Math.max(1, Math.min(this.quantity() + delta, product.stock_quantity));
    this.quantity.set(newQty);
  }

  addToCart(): void {
    const product = this.product();
    if (!product || product.stock_quantity === 0) return;
    this.cartService.addItem(product, this.quantity());
    this.toast.success(`${product.name} added to cart`);
  }

  submitReview(): void {
    if (!this.auth.isLoggedIn()) {
      this.toast.info('Please sign in to leave a review');
      return;
    }
    const product = this.product();
    if (!product) return;

    this.submittingReview.set(true);
    this.productService.addReview(product.id, this.reviewForm).subscribe({
      next: review => {
        this.product.update(p => p ? { ...p, reviews: [review, ...p.reviews] } : p);
        this.reviewForm = { rating: 5, title: '', body: '' };
        this.toast.success('Review submitted successfully!');
        this.submittingReview.set(false);
      },
      error: (err) => {
        this.toast.error(err.error?.detail ?? 'Failed to submit review');
        this.submittingReview.set(false);
      },
    });
  }

  setTab(key: string): void {
    this.activeTab.set(key as 'description' | 'ingredients' | 'reviews');
  }

  setRating(rating: number): void {
    this.reviewForm = { ...this.reviewForm, rating };
  }

  get averageRating(): number {
    return this.product()?.average_rating ?? 0;
  }

  ratingBarWidth(rating: number): string {
    const reviews = this.product()?.reviews ?? [];
    if (!reviews.length) return '0%';
    const count = reviews.filter(r => r.rating === rating).length;
    return `${(count / reviews.length) * 100}%`;
  }

  ratingCount(rating: number): number {
    return this.product()?.reviews.filter(r => r.rating === rating).length ?? 0;
  }

  roundedRating(value: number): number {
    return Math.round(value);
  }
}
