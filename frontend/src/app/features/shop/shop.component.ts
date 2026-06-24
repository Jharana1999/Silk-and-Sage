import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { ProductService } from '../../core/services/product.service';
import { Product, Category, ProductFilters } from '../../core/models/product.model';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ProductCardComponent],
  templateUrl: './shop.component.html',
})
export class ShopComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  loading = signal(true);
  total = signal(0);
  pages = signal(0);

  filters = signal<ProductFilters>({ page: 1, per_page: 12, sort_by: 'created_at', sort_order: 'desc' });
  searchQuery = '';
  filterOpen = signal(false);

  readonly sortOptions = [
    { value: 'created_at|desc', label: 'Newest First' },
    { value: 'price|asc', label: 'Price: Low to High' },
    { value: 'price|desc', label: 'Price: High to Low' },
    { value: 'name|asc', label: 'Name A–Z' },
  ];

  readonly flagFilters = [
    { key: 'is_featured', label: 'Featured' },
    { key: 'is_bestseller', label: 'Bestsellers' },
    { key: 'is_new_arrival', label: 'New Arrivals' },
  ];

  private readonly searchSubject = new Subject<string>();

  ngOnInit(): void {
    this.productService.getCategories().subscribe(cats => this.categories.set(cats));

    this.route.queryParams.subscribe(params => {
      const newFilters: ProductFilters = { page: 1, per_page: 12, sort_by: 'created_at', sort_order: 'desc' };
      if (params['category']) newFilters.category_slug = params['category'];
      if (params['is_bestseller']) newFilters.is_bestseller = true;
      if (params['is_new_arrival']) newFilters.is_new_arrival = true;
      if (params['is_featured']) newFilters.is_featured = true;
      this.filters.set(newFilters);
      this.loadProducts();
    });

    this.searchSubject.pipe(debounceTime(400), distinctUntilChanged()).subscribe(q => {
      this.filters.update(f => ({ ...f, search: q || undefined, page: 1 }));
      this.loadProducts();
    });
  }

  loadProducts(): void {
    this.loading.set(true);
    this.productService.getProducts(this.filters()).subscribe({
      next: res => {
        this.products.set(res.items);
        this.total.set(res.total);
        this.pages.set(res.pages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearch(q: string): void {
    this.searchSubject.next(q);
  }

  setCategory(slug: string | undefined): void {
    this.filters.update(f => ({ ...f, category_slug: slug, page: 1 }));
    this.loadProducts();
  }

  setSort(value: string): void {
    const [sortBy, sortOrder] = value.split('|') as [string, 'asc' | 'desc'];
    this.filters.update(f => ({ ...f, sort_by: sortBy, sort_order: sortOrder, page: 1 }));
    this.loadProducts();
  }

  setPage(page: number): void {
    this.filters.update(f => ({ ...f, page }));
    this.loadProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleFilterOpen(): void {
    this.filterOpen.update(v => !v);
  }

  toggleFlagFilter(key: string): void {
    const current = (this.filters() as Record<string, unknown>)[key];
    this.filters.update(f => ({ ...f, [key]: current ? undefined : true, page: 1 }));
    this.loadProducts();
  }

  isFlagActive(key: string): boolean {
    return !!(this.filters() as Record<string, unknown>)[key];
  }

  clearFilters(): void {
    this.filters.set({ page: 1, per_page: 12, sort_by: 'created_at', sort_order: 'desc' });
    this.loadProducts();
  }

  onSortChange(event: Event): void {
    this.setSort((event.target as HTMLSelectElement).value);
  }

  prevPage(): void {
    this.setPage((this.filters().page ?? 1) - 1);
  }

  nextPage(): void {
    this.setPage((this.filters().page ?? 1) + 1);
  }

  get isFirstPage(): boolean {
    return (this.filters().page ?? 1) === 1;
  }

  get isLastPage(): boolean {
    return (this.filters().page ?? 1) === this.pages();
  }

  get currentPage(): number {
    return this.filters().page ?? 1;
  }

  get pageRange(): number[] {
    return Array.from({ length: this.pages() }, (_, i) => i + 1);
  }

  get currentSortValue(): string {
    const f = this.filters();
    return `${f.sort_by}|${f.sort_order}`;
  }
}
