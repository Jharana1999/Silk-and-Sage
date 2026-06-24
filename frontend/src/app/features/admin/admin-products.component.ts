import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { ToastService } from '../../core/services/toast.service';
import { Product, Category } from '../../core/models/product.model';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-products.component.html',
})
export class AdminProductsComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  loading = signal(true);
  showModal = signal(false);
  editingProduct = signal<Product | null>(null);
  submitting = signal(false);
  uploadingImage = signal(false);
  selectedProductId = signal<number | null>(null);

  form = this.fb.group({
    name: ['', [Validators.required]],
    short_description: [''],
    description: [''],
    price: [0, [Validators.required, Validators.min(0.01)]],
    compare_at_price: [null as number | null],
    sku: [''],
    stock_quantity: [0, [Validators.required, Validators.min(0)]],
    category_id: [null as number | null],
    is_active: [true],
    is_featured: [false],
    is_bestseller: [false],
    is_new_arrival: [false],
    ingredients: [''],
    how_to_use: [''],
  });

  ngOnInit(): void {
    this.loadProducts();
    this.productService.getCategories().subscribe(cats => this.categories.set(cats));
  }

  loadProducts(): void {
    this.productService.getProducts({ per_page: 50 }).subscribe({
      next: res => {
        this.products.set(res.items);
        this.loading.set(false);
      },
    });
  }

  openCreate(): void {
    this.editingProduct.set(null);
    this.form.reset({ is_active: true, is_featured: false, is_bestseller: false, is_new_arrival: false, stock_quantity: 0, price: 0 });
    this.showModal.set(true);
  }

  openEdit(product: Product): void {
    this.editingProduct.set(product);
    this.form.patchValue({
      name: product.name,
      short_description: product.short_description,
      description: product.description,
      price: product.price,
      compare_at_price: product.compare_at_price,
      sku: product.sku,
      stock_quantity: product.stock_quantity,
      category_id: product.category_id,
      is_active: product.is_active,
      is_featured: product.is_featured,
      is_bestseller: product.is_bestseller,
      is_new_arrival: product.is_new_arrival,
      ingredients: product.ingredients,
      how_to_use: product.how_to_use,
    });
    this.showModal.set(true);
  }

  submit(): void {
    if (this.form.invalid) return;
    this.submitting.set(true);
    const data = this.form.value;
    const editing = this.editingProduct();

    const obs = editing
      ? this.productService.updateProduct(editing.id, data)
      : this.productService.createProduct(data);

    obs.subscribe({
      next: () => {
        this.toast.success(editing ? 'Product updated' : 'Product created');
        this.showModal.set(false);
        this.loadProducts();
        this.submitting.set(false);
      },
      error: err => {
        this.toast.error(err.error?.detail ?? 'Failed to save product');
        this.submitting.set(false);
      },
    });
  }

  deleteProduct(product: Product): void {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    this.productService.deleteProduct(product.id).subscribe({
      next: () => {
        this.products.update(ps => ps.filter(p => p.id !== product.id));
        this.toast.success('Product deleted');
      },
      error: () => this.toast.error('Failed to delete product'),
    });
  }

  onImageUpload(event: Event, productId: number): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploadingImage.set(true);
    this.selectedProductId.set(productId);
    this.productService.uploadImage(productId, file, true).subscribe({
      next: () => {
        this.toast.success('Image uploaded');
        this.loadProducts();
        this.uploadingImage.set(false);
      },
      error: () => {
        this.toast.error('Failed to upload image');
        this.uploadingImage.set(false);
      },
    });
  }
}
