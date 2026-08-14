import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BillingStatus {
  plan: 'free' | 'pro' | 'enterprise';
  status: string | null;
}

@Injectable({ providedIn: 'root' })
export class BillingService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/billing`;

  getStatus(): Observable<BillingStatus> {
    return this.http.get<BillingStatus>(`${this.base}/status`);
  }

  createCheckoutSession(plan: 'pro' | 'enterprise'): Observable<{ url: string }> {
    return this.http.post<{ url: string }>(`${this.base}/create-checkout-session`, { plan });
  }

  createPortalSession(): Observable<{ url: string }> {
    return this.http.post<{ url: string }>(`${this.base}/create-portal-session`, {});
  }
}