import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center p-6 bg-cream-100">
      <div class="w-full max-w-md">
        <div class="text-center mb-10">
          <a routerLink="/" class="inline-block font-serif text-2xl font-semibold text-sage-700 mb-6">Silk <span class="text-gold-500">&</span> Sage</a>
          <h1 class="font-serif text-3xl text-sage-800">Create Account</h1>
          <p class="font-sans text-sm text-gray-500 mt-2">Join the Silk and Sage community</p>
        </div>

        <div class="bg-white shadow-card p-8">
          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-5">
            <div>
              <label class="label-field">Full Name</label>
              <input type="text" formControlName="full_name" class="input-field" placeholder="Your full name">
            </div>
            <div>
              <label class="label-field">Email Address</label>
              <input type="email" formControlName="email" class="input-field" placeholder="you@example.com">
            </div>
            <div>
              <label class="label-field">Password</label>
              <input type="password" formControlName="password" class="input-field" placeholder="At least 8 characters">
            </div>

            @if (error()) {
              <div class="bg-red-50 border-l-4 border-red-400 p-4">
                <p class="font-sans text-sm text-red-600">{{ error() }}</p>
              </div>
            }

            <button type="submit" [disabled]="loading()" class="btn-primary w-full">
              {{ loading() ? 'Creating Account...' : 'Create Account' }}
            </button>
          </form>

          <p class="font-sans text-xs text-gray-400 text-center mt-4">
            By creating an account, you agree to our <a href="#" class="underline">Terms of Service</a> and <a href="#" class="underline">Privacy Policy</a>.
          </p>
        </div>

        <p class="font-sans text-sm text-center text-gray-500 mt-6">
          Already have an account?
          <a routerLink="/auth/login" class="text-sage-600 hover:underline font-medium">Sign in</a>
        </p>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  loading = signal(false);
  error = signal<string | null>(null);

  form = this.fb.group({
    full_name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);

    this.auth.register(this.form.value as any).subscribe({
      next: () => {
        this.router.navigate(['/']);
        this.toast.success('Account created! Welcome to Silk and Sage.');
      },
      error: err => {
        this.error.set(err.error?.detail ?? 'Registration failed. Please try again.');
        this.loading.set(false);
      },
    });
  }
}
