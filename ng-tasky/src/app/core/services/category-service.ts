import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Category {
  _id: string;
  name: string;
  color: string;
  board: string;
}

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/categories`;

  getCategories(boardId: string): Observable<Category[]> {
    return this.http.get<Category[]>(this.base, { params: { board: boardId } });
  }

  createCategory(boardId: string, name: string, color: string): Observable<Category> {
    return this.http.post<Category>(this.base, { board: boardId, name, color });
  }

  updateCategory(boardId: string, id: string, data: { name?: string; color?: string }): Observable<Category> {
    return this.http.put<Category>(`${this.base}/${id}`, { board: boardId, ...data });
  }

  deleteCategory(boardId: string, id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/${id}`, { params: { board: boardId } });
  }
}