import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  confirm_password?: string;
  first_name?: string;
  last_name?: string;
}

export interface AuthResponse {
  token: string;
  refresh_token?: string;
  user?: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
}

const TOKEN_KEY = 'auth_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  // Pour l'initialisation du token
  private tokenSubject = new BehaviorSubject<string | null>(
    this.isBrowser ? localStorage.getItem(TOKEN_KEY) : null
  );

 
  token$: Observable<string | null> = this.tokenSubject.asObservable();

// Pour la connection
  login(data: LoginData): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, data)
      .pipe(
        tap((response) => {
          this.setToken(response.token);
        })
      );
  }

// Pour l'inscription
  signup(data: RegisterData): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, data)
      .pipe(
        tap((response) => {
          if (response?.token) {
            this.setToken(response.token);
          }
        })
      );
  }

  // Pour la déconnection
  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem(TOKEN_KEY);
    }
    this.tokenSubject.next(null);
  }

 
  getToken(): string | null {
    return this.tokenSubject.value;
  }

  
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  private setToken(token: string): void {
    if (this.isBrowser) {
      localStorage.setItem(TOKEN_KEY, token);
    }
    this.tokenSubject.next(token);
  }
}