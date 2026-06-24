import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { User, AuthResponse, LoginRequest, RegisterRequest } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  private readonly _user = signal<User | null>(this.loadStoredUser());
  private readonly _token = signal<string | null>(localStorage.getItem('access_token'));

  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();
  readonly isLoggedIn = computed(() => !!this._user());
  readonly isAdmin = computed(() => this._user()?.role === 'admin');

  private loadStoredUser(): User | null {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  login(credentials: LoginRequest) {
    return this.api.post<AuthResponse>('/auth/login', credentials).pipe(
      tap(res => this.handleAuthResponse(res))
    );
  }

  register(data: RegisterRequest) {
    return this.api.post<AuthResponse>('/auth/register', data).pipe(
      tap(res => this.handleAuthResponse(res))
    );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    this._user.set(null);
    this._token.set(null);
    this.router.navigate(['/']);
  }

  refreshUserProfile() {
    return this.api.get<User>('/auth/me').pipe(
      tap(user => {
        this._user.set(user);
        localStorage.setItem('user', JSON.stringify(user));
      })
    );
  }

  private handleAuthResponse(res: AuthResponse): void {
    localStorage.setItem('access_token', res.access_token);
    localStorage.setItem('refresh_token', res.refresh_token);
    localStorage.setItem('user', JSON.stringify(res.user));
    this._user.set(res.user);
    this._token.set(res.access_token);
  }
}
