import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  template: `
    <div class="min-h-screen flex">
      <div class="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <img src="https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=1000&q=80" alt="Skincare" class="absolute inset-0 w-full h-full object-cover">
        <div class="absolute inset-0 bg-sage-900/40 flex items-end p-12">
          <div>
            <span class="font-serif text-3xl font-semibold text-white tracking-wide">Silk <span class="text-gold-400">&</span> Sage</span>
            <p class="font-sans text-cream-200 text-sm mt-2 max-w-xs">Your journey to radiant skin starts here.</p>
          </div>
        </div>
      </div>
      <div class="w-full lg:w-1/2 flex items-center justify-center p-8 bg-cream-100">
        <div class="w-full max-w-md">
          <div class="text-center mb-10">
            <a routerLink="/" class="inline-block font-serif text-2xl font-semibold text-sage-700 lg:hidden mb-6">Silk <span class="text-gold-500">&</span> Sage</a>
            <h1 class="font-serif text-3xl text-sage-800">Welcome Back</h1>
            <p class="font-sans text-sm text-gray-500 mt-2">Sign in to your account</p>
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-5">
            <div>
              <label class="label-field">Email Address</label>
              <input type="email" formControlName="email" class="input-field" placeholder="you@example.com">
            </div>
            <div>
              <label class="label-field">Password</label>
              <input type="password" formControlName="password" class="input-field" placeholder="••••••••">
            </div>

            @if (error()) {
              <div class="bg-red-50 border-l-4 border-red-400 p-4">
                <p class="font-sans text-sm text-red-600">{{ error() }}</p>
              </div>
            }

            <button type="submit" [disabled]="loading()" class="btn-primary w-full mt-2">
              {{ loading() ? 'Signing in...' : 'Sign In' }}
            </button>
          </form>

          <p class="font-sans text-sm text-center text-gray-500 mt-8">
            Don't have an account?
            <a routerLink="/auth/register" class="text-sage-600 hover:underline font-medium">Create one</a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  loading = signal(false);
  error = signal<string | null>(null);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);

    this.auth.login(this.form.value as any).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
        this.router.navigateByUrl(returnUrl);
        this.toast.success('Welcome back!');
      },
      error: err => {
        this.error.set(err.error?.detail ?? 'Invalid credentials. Please try again.');
        this.loading.set(false);
      },
    });
  }
}
