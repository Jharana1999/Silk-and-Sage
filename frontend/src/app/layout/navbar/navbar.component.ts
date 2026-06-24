import { Component, inject, signal, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  readonly auth = inject(AuthService);
  readonly cart = inject(CartService);

  isScrolled = signal(false);
  mobileMenuOpen = signal(false);
  userMenuOpen = signal(false);

  readonly navLinks = [
    { label: 'Shop', path: '/shop' },
    { label: 'Serums', path: '/shop', query: { category: 'serums' } },
    { label: 'Moisturizers', path: '/shop', query: { category: 'moisturizers' } },
    { label: 'Cleansers', path: '/shop', query: { category: 'cleansers' } },
  ];

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled.set(window.scrollY > 50);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }

  toggleUserMenu(): void {
    this.userMenuOpen.update(v => !v);
  }

  closeMenus(): void {
    this.mobileMenuOpen.set(false);
    this.userMenuOpen.set(false);
  }

  logout(): void {
    this.auth.logout();
    this.closeMenus();
  }
}
