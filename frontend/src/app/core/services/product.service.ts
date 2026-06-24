import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  Product, ProductDetail, ProductListResponse,
  ProductFilters, Category, ReviewCreate, ProductReview,
} from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly api = inject(ApiService);

  getProducts(filters: ProductFilters = {}): Observable<ProductListResponse> {
    return this.api.get<ProductListResponse>('/products', filters as Record<string, any>);
  }

  getFeaturedProducts(limit = 8): Observable<Product[]> {
    return this.api.get<Product[]>('/products/featured', { limit });
  }

  getProductBySlug(slug: string): Observable<ProductDetail> {
    return this.api.get<ProductDetail>(`/products/${slug}`);
  }

  getCategories(): Observable<Category[]> {
    return this.api.get<Category[]>('/categories');
  }

  addReview(productId: number, review: ReviewCreate): Observable<ProductReview> {
    return this.api.post<ProductReview>(`/products/${productId}/reviews`, review);
  }

  uploadImage(productId: number, file: File, isPrimary = false): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('is_primary', String(isPrimary));
    return this.api.upload<any>(`/products/${productId}/images`, formData);
  }

  createProduct(data: any): Observable<Product> {
    return this.api.post<Product>('/products', data);
  }

  updateProduct(id: number, data: any): Observable<Product> {
    return this.api.put<Product>(`/products/${id}`, data);
  }

  deleteProduct(id: number): Observable<void> {
    return this.api.delete<void>(`/products/${id}`);
  }

  createCategory(data: any): Observable<Category> {
    return this.api.post<Category>('/categories', data);
  }

  updateCategory(id: number, data: any): Observable<Category> {
    return this.api.put<Category>(`/categories/${id}`, data);
  }

  deleteCategory(id: number): Observable<void> {
    return this.api.delete<void>(`/categories/${id}`);
  }
}
