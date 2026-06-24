import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-cream-100">
      <div class="text-center px-6">
        <p class="font-serif text-8xl text-sage-200 font-semibold mb-4">404</p>
        <h1 class="font-serif text-3xl text-sage-800 mb-4">Page Not Found</h1>
        <div class="gold-line mb-6"></div>
        <p class="font-sans text-sm text-gray-500 mb-8 max-w-sm mx-auto">The page you're looking for doesn't exist. Let us guide you back to beautiful skin.</p>
        <div class="flex gap-4 justify-center">
          <a routerLink="/" class="btn-primary">Go Home</a>
          <a routerLink="/shop" class="btn-secondary">Shop Now</a>
        </div>
      </div>
    </div>
  `,
})
export class NotFoundComponent {}
