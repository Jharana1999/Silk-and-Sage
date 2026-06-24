import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { ToastService } from '../../core/services/toast.service';
import { Category } from '../../core/models/product.model';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex">
      <aside class="w-64 bg-sage-900 text-cream-200 flex flex-col flex-shrink-0">
        <div class="p-6 border-b border-white/10">
          <a routerLink="/" class="font-serif text-xl text-white tracking-wide">Silk <span class="text-gold-400">&</span> Sage</a>
          <p class="font-sans text-xs text-sage-400 mt-1 uppercase tracking-widest">Admin Panel</p>
        </div>
        <nav class="flex-1 py-6 px-3">
          @for (item of navItems; track item.label) {
            <a [routerLink]="item.path" class="block px-4 py-3 font-sans text-sm text-sage-300 hover:bg-sage-800 hover:text-white rounded mb-1 transition-all">{{ item.label }}</a>
          }
        </nav>
        <div class="p-4 border-t border-white/10">
          <a routerLink="/" class="font-sans text-xs text-sage-400 hover:text-cream-200">← Back to Store</a>
        </div>
      </aside>

      <main class="flex-1 overflow-auto p-8">
        <div class="flex items-center justify-between mb-8">
          <h1 class="font-serif text-3xl text-sage-800">Categories</h1>
          <button (click)="openCreate()" class="btn-primary text-xs">+ Add Category</button>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          @for (cat of categories(); track cat.id) {
            <div class="bg-white shadow-card p-5">
              <div class="flex items-start justify-between mb-3">
                <h3 class="font-serif text-lg text-sage-700">{{ cat.name }}</h3>
                <div class="flex gap-2">
                  <button (click)="openEdit(cat)" class="font-sans text-xs text-sage-600 hover:underline">Edit</button>
                  <button (click)="deleteCategory(cat)" class="font-sans text-xs text-red-400 hover:underline">Delete</button>
                </div>
              </div>
              <p class="font-sans text-xs text-gray-400 mb-2">Slug: /{{ cat.slug }}</p>
              @if (cat.description) {
                <p class="font-sans text-sm text-gray-600 line-clamp-2 mb-2">{{ cat.description }}</p>
              }
              <p class="font-sans text-xs text-sage-500">{{ cat.product_count }} products</p>
            </div>
          }
        </div>
      </main>
    </div>

    @if (showModal()) {
      <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" (click)="showModal.set(false)">
        <div class="bg-white w-full max-w-md shadow-2xl" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 class="font-serif text-xl text-sage-800">{{ editing() ? 'Edit Category' : 'New Category' }}</h2>
            <button (click)="showModal.set(false)">✕</button>
          </div>
          <form [formGroup]="form" (ngSubmit)="submit()" class="p-6 space-y-4">
            <div>
              <label class="label-field">Name *</label>
              <input type="text" formControlName="name" class="input-field">
            </div>
            <div>
              <label class="label-field">Description</label>
              <textarea formControlName="description" rows="3" class="input-field resize-none"></textarea>
            </div>
            <div>
              <label class="label-field">Sort Order</label>
              <input type="number" formControlName="sort_order" class="input-field">
            </div>
            <div class="flex justify-end gap-3 pt-2">
              <button type="button" (click)="showModal.set(false)" class="btn-secondary text-xs">Cancel</button>
              <button type="submit" [disabled]="submitting()" class="btn-primary text-xs">
                {{ submitting() ? 'Saving...' : 'Save' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class AdminCategoriesComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  categories = signal<Category[]>([]);
  showModal = signal(false);
  editing = signal<Category | null>(null);
  submitting = signal(false);

  readonly navItems = [
    { label: 'Dashboard', path: '/admin' },
    { label: 'Products', path: '/admin/products' },
    { label: 'Orders', path: '/admin/orders' },
    { label: 'Categories', path: '/admin/categories' },
  ];

  form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    sort_order: [0],
  });

  ngOnInit(): void {
    this.productService.getCategories().subscribe(cats => this.categories.set(cats));
  }

  openCreate(): void {
    this.editing.set(null);
    this.form.reset({ sort_order: 0 });
    this.showModal.set(true);
  }

  openEdit(cat: Category): void {
    this.editing.set(cat);
    this.form.patchValue({ name: cat.name, description: cat.description, sort_order: cat.sort_order });
    this.showModal.set(true);
  }

  submit(): void {
    if (this.form.invalid) return;
    this.submitting.set(true);
    const edit = this.editing();
    const obs = edit
      ? this.productService.updateCategory(edit.id, this.form.value)
      : this.productService.createCategory(this.form.value);

    obs.subscribe({
      next: () => {
        this.toast.success(edit ? 'Category updated' : 'Category created');
        this.showModal.set(false);
        this.productService.getCategories().subscribe(cats => this.categories.set(cats));
        this.submitting.set(false);
      },
      error: () => {
        this.toast.error('Failed to save category');
        this.submitting.set(false);
      },
    });
  }

  deleteCategory(cat: Category): void {
    if (!confirm(`Delete "${cat.name}"?`)) return;
    this.productService.deleteCategory(cat.id).subscribe({
      next: () => {
        this.categories.update(cs => cs.filter(c => c.id !== cat.id));
        this.toast.success('Category deleted');
      },
      error: () => this.toast.error('Failed to delete category'),
    });
  }
}
