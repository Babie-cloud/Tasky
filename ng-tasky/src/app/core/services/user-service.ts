import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserProfile {
  _id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  location?: string;
  birthDate?: string | null;
  bio?: string;
  linkedIn?: string;
  github?: string;
  jobTitle?: string;
  notifyOnInvite?: boolean;
  notifyOnRemoval?: boolean;
}

export interface UpdateProfileData {
  first_name?: string;
  last_name?: string;
  phone?: string;
  location?: string;
  birthDate?: string | null;
  bio?: string;
  linkedIn?: string;
  github?: string;
  jobTitle?: string;
}

export interface NotificationPrefs {
  notifyOnInvite: boolean;
  notifyOnRemoval: boolean;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/users`;

  getMe(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.base}/me`);
  }

  updateMe(data: UpdateProfileData): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.base}/me`, data);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.base}/me/password`, {
      currentPassword,
      newPassword,
    });
  }

  updateNotificationPrefs(prefs: NotificationPrefs): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.base}/me`, prefs);
  }

  deleteAccount(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/me`);
  }
}