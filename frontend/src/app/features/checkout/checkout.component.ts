import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { CheckoutRequest } from '../../core/models/order.model';
import { AssetUrlPipe } from '../../shared/pipes/asset-url.pipe';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, AssetUrlPipe],
  templateUrl: './checkout.component.html',
})
export class CheckoutComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly cartService = inject(CartService);
  private readonly orderService = inject(OrderService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  readonly auth = inject(AuthService);

  step = signal<1 | 2 | 3>(1);
  submitting = signal(false);

  shippingForm = this.fb.group({
    full_name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.pattern(/^[0-9+\-\s]{7,15}$/)],
    address_line1: ['', Validators.required],
    address_line2: [''],
    city: ['', Validators.required],
    state: ['', Validators.required],
    zip_code: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
    country: ['Nepal', Validators.required],
  });

  get cart() { return this.cartService.cart; }
  get isEmpty() { return this.cartService.isEmpty; }

  readonly nepalProvinces = [
    'Koshi', 'Madhesh', 'Bagmati', 'Gandaki', 'Lumbini', 'Karnali', 'Sudurpashchim',
  ];

  ngOnInit(): void {
    const user = this.auth.user();
    if (user) {
      this.shippingForm.patchValue({ email: user.email, full_name: user.full_name, phone: user.phone ?? '' });
    }
  }

  nextStep(): void {
    if (this.shippingForm.valid) {
      this.step.set(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      this.shippingForm.markAllAsTouched();
      this.toast.error('Please fill in all required fields');
    }
  }

  placeOrder(): void {
    if (this.cartService.isEmpty()) {
      this.toast.error('Your cart is empty');
      return;
    }

    this.submitting.set(true);
    const formVal = this.shippingForm.value;

    const payload: CheckoutRequest = {
      items: this.cartService.items().map(i => ({ product_id: i.product.id, quantity: i.quantity })),
      shipping_address: {
        full_name: formVal.full_name!,
        email: formVal.email!,
        phone: formVal.phone ?? undefined,
        address_line1: formVal.address_line1!,
        address_line2: formVal.address_line2 ?? undefined,
        city: formVal.city!,
        state: formVal.state!,
        zip_code: formVal.zip_code!,
        country: formVal.country!,
      },
    };

    this.orderService.createOrder(payload).subscribe({
      next: res => {
        this.cartService.clear();
        this.router.navigate(['/order-confirmation', res.order_number]);
      },
      error: err => {
        this.toast.error(err.error?.detail ?? 'Failed to place order. Please try again.');
        this.submitting.set(false);
      },
    });
  }

  fieldError(field: string): string | null {
    const ctrl = this.shippingForm.get(field);
    if (!ctrl || !ctrl.touched || ctrl.valid) return null;
    if (ctrl.hasError('required')) return 'This field is required';
    if (ctrl.hasError('email')) return 'Please enter a valid email';
    if (ctrl.hasError('pattern')) return 'Invalid format';
    if (ctrl.hasError('minlength')) return 'Too short';
    return 'Invalid value';
  }
}
