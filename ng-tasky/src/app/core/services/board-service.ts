import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BoardMember {
  _id: string;
  user: { _id: string; email: string; first_name?: string; last_name?: string } | null;
  email: string;
  role: 'admin' | 'member' | 'observer';
  status: 'pending' | 'active';
}

export interface Board {
  _id: string;
  name: string;
  owner: { _id: string; email: string; first_name?: string; last_name?: string };
  members: BoardMember[];
}

@Injectable({ providedIn: 'root' })
export class BoardService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/boards`;

  getMyBoards(): Observable<Board[]> {
    return this.http.get<Board[]>(`${this.base}/mine`);
  }

  createBoard(name: string): Observable<Board> {
    return this.http.post<Board>(this.base, { name });
  }

  getBoard(boardId: string): Observable<Board> {
    return this.http.get<Board>(`${this.base}/${boardId}`);
  }

  deleteBoard(boardId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/${boardId}`);
  }

  renameBoard(boardId: string, name: string): Observable<Board> {
    return this.http.put<Board>(`${this.base}/${boardId}`, { name });
  }

  invite(boardId: string, email: string, role: 'admin' | 'member' | 'observer'): Observable<any> {
    return this.http.post(`${this.base}/${boardId}/invite`, { email, role });
  }

  acceptInvite(token: string): Observable<any> {
    return this.http.post(`${this.base}/invite/accept/${token}`, {});
  }

  changeMemberRole(boardId: string, memberId: string, role: string): Observable<Board> {
    return this.http.put<Board>(`${this.base}/${boardId}/members/${memberId}`, { role });
  }

  removeMember(boardId: string, memberId: string): Observable<Board> {
    return this.http.delete<Board>(`${this.base}/${boardId}/members/${memberId}`);
  }
}