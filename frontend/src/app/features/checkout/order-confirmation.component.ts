import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../core/services/order.service';
import { Order } from '../../core/models/order.model';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './order-confirmation.component.html',
})
export class OrderConfirmationComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly orderService = inject(OrderService);

  order = signal<Order | null>(null);
  orderNumber = signal('');

  ngOnInit(): void {
    const num = this.route.snapshot.paramMap.get('orderNumber')!;
    this.orderNumber.set(num);
    this.orderService.getOrder(num).subscribe({
      next: o => this.order.set(o),
    });
  }
}
