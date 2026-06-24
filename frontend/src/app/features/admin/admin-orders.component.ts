import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../core/services/order.service';
import { ToastService } from '../../core/services/toast.service';
import { Order, OrderStatus } from '../../core/models/order.model';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './admin-orders.component.html',
})
export class AdminOrdersComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly toast = inject(ToastService);

  orders = signal<Order[]>([]);
  loading = signal(true);
  selectedOrder = signal<Order | null>(null);
  newStatus = signal<OrderStatus>('confirmed');
  trackingNumber = signal('');
  updating = signal(false);

  readonly statuses: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.orderService.getAllOrders({ per_page: 50 }).subscribe({
      next: orders => {
        this.orders.set(orders);
        this.loading.set(false);
      },
    });
  }

  openOrder(order: Order): void {
    this.selectedOrder.set(order);
    this.newStatus.set(order.status);
    this.trackingNumber.set(order.tracking_number ?? '');
  }

  updateStatus(): void {
    const order = this.selectedOrder();
    if (!order) return;
    this.updating.set(true);

    this.orderService.updateOrderStatus(order.id, this.newStatus(), this.trackingNumber() || undefined).subscribe({
      next: updated => {
        this.orders.update(os => os.map(o => o.id === updated.id ? updated : o));
        this.selectedOrder.set(updated);
        this.toast.success('Order status updated');
        this.updating.set(false);
      },
      error: () => {
        this.toast.error('Failed to update order');
        this.updating.set(false);
      },
    });
  }

  statusColor(status: string): string {
    const map: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-600',
      payment_pending: 'bg-yellow-100 text-yellow-700',
      confirmed: 'bg-blue-100 text-blue-700',
      processing: 'bg-purple-100 text-purple-700',
      shipped: 'bg-gold-100 text-gold-700',
      delivered: 'bg-sage-100 text-sage-700',
      cancelled: 'bg-red-100 text-red-600',
      refunded: 'bg-orange-100 text-orange-600',
    };
    return map[status] || 'bg-gray-100 text-gray-600';
  }
}
