import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { PromoCarouselComponent } from '../../shared/components/promo-carousel/promo-carousel.component';
import { ProductService } from '../../core/services/product.service';
import { ToastService } from '../../core/services/toast.service';
import { Product, Category } from '../../core/models/product.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, ProductCardComponent, PromoCarouselComponent],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly toast = inject(ToastService);

  featuredProducts = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  loading = signal(true);
  notifyEmail = '';

  readonly howItWorks = [
    { step: '01', title: 'Find Your Match', desc: 'Browse 500+ products across 50+ trusted brands — all in one place.' },
    { step: '02', title: 'Consult an Expert', desc: 'Get a free monthly dermatologist consultation to guide your skincare routine.' },
    { step: '03', title: 'Order at Best Price', desc: 'We guarantee the lowest prices on every brand we carry in Nepal.' },
    { step: '04', title: 'Delivered to You', desc: 'Fast, reliable delivery across Nepal. Free on orders above Rs. 2,000.' },
  ];

  readonly values = [
    { icon: '🩺', title: 'Free Dermatologist Consult' },
    { icon: '🏷️', title: "Nepal's Best Prices" },
    { icon: '🚚', title: 'Free Delivery Rs. 2,000+' },
    { icon: '✅', title: '100% Genuine Products' },
  ];

  readonly testimonials = [
    { name: 'Erica Sapkota', rating: 5, text: 'Found The Ordinary products here at half the price of other stores. The free dermatologist consultation helped me build a routine that actually works for my skin type.', product: 'The Ordinary Niacinamide' },
    { name: 'Sulakshana Regmi', rating: 5, text: 'Finally a Nepali store that stocks CeraVe and Cetaphil at genuine prices! Delivery was fast and everything arrived well-packaged. Will definitely keep shopping here.', product: 'CeraVe Moisturizing Cream' },
    { name: 'Ujjwal Sapkota', rating: 5, text: 'The monthly skin consultation was incredibly helpful. The dermatologist pinpointed my skin concerns and recommended exactly what I needed. Ordered the same day!', product: 'Klairs Vitamin C Serum' },
  ];

  readonly stars = Array(5).fill(0);

  ngOnInit(): void {
    this.productService.getFeaturedProducts(6).subscribe({
      next: products => { this.featuredProducts.set(products); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
    this.productService.getCategories().subscribe({
      next: cats => this.categories.set(cats.slice(0, 6)),
    });
  }

  subscribeNotify(): void {
    if (!this.notifyEmail.trim()) return;
    this.toast.success("You're on the list! We'll notify you when AI skin analysis launches.");
    this.notifyEmail = '';
  }
}
