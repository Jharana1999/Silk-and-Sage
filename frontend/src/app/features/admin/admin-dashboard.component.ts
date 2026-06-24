import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../core/services/order.service';
import { ProductService } from '../../core/services/product.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './admin-dashboard.component.html',
})
export class AdminDashboardComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly productService = inject(ProductService);

  orders = signal<any[]>([]);
  stats = signal({ orders: 0, revenue: 0, products: 0, pending: 0 });
  loading = signal(true);

  readonly navItems = [
    { label: 'Dashboard', path: '/admin', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { label: 'Products', path: '/admin/products', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { label: 'Orders', path: '/admin/orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { label: 'Categories', path: '/admin/categories', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
  ];

  ngOnInit(): void {
    this.orderService.getAllOrders({ per_page: 5 }).subscribe({
      next: orders => {
        this.orders.set(orders);
        const revenue = orders.reduce((s, o) => s + o.total_amount, 0);
        const pending = orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length;
        this.stats.update(s => ({ ...s, orders: orders.length, revenue, pending }));
        this.loading.set(false);
      },
    });
    this.productService.getProducts({ per_page: 1 }).subscribe({
      next: res => this.stats.update(s => ({ ...s, products: res.total })),
    });
  }
}
