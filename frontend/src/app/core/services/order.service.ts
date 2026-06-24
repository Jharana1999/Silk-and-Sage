import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Order, CheckoutRequest } from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly api = inject(ApiService);

  createOrder(data: CheckoutRequest): Observable<{ order_id: number; order_number: string; total_amount: number }> {
    return this.api.post('/orders', data);
  }

  getMyOrders(): Observable<Order[]> {
    return this.api.get<Order[]>('/orders/my-orders');
  }

  getOrder(orderNumber: string): Observable<Order> {
    return this.api.get<Order>(`/orders/${orderNumber}`);
  }

  getAllOrders(params: Record<string, any> = {}): Observable<Order[]> {
    return this.api.get<Order[]>('/orders', params);
  }

  updateOrderStatus(orderId: number, status: string, trackingNumber?: string): Observable<Order> {
    return this.api.put<Order>(`/orders/${orderId}/status`, { status, tracking_number: trackingNumber });
  }

  createPaymentIntent(orderId: number): Observable<any> {
    return this.api.post(`/payments/create-payment-intent?order_id=${orderId}`);
  }
}
