import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserProfile {
  _id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  // Attention : ces routes sont montées sur /users (pas /api/users) dans app.js
  private base = `${environment.apiUrl}/users`;

  getMe(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.base}/me`);
  }

  updateMe(data: { first_name?: string; last_name?: string }): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.base}/me`, data);
  }
}