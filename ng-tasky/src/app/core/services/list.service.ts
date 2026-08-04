import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TaskList {
  _id: string;
  board: string;
  title: string;
  order: number;
}

@Injectable({ providedIn: 'root' })
export class ListService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/lists`;

  getLists(boardId: string): Observable<TaskList[]> {
    return this.http.get<TaskList[]>(this.base, { params: { board: boardId } });
  }

  createList(boardId: string, title: string): Observable<TaskList> {
    return this.http.post<TaskList>(this.base, { board: boardId, title });
  }

  renameList(boardId: string, listId: string, title: string): Observable<TaskList> {
    return this.http.put<TaskList>(`${this.base}/${listId}`, { board: boardId, title });
  }

  reorderLists(boardId: string, orderedIds: string[]): Observable<any> {
    return this.http.put(`${this.base}/reorder`, { board: boardId, orderedIds });
  }

  deleteList(boardId: string, listId: string): Observable<any> {
    return this.http.delete(`${this.base}/${listId}`, { params: { board: boardId } });
  }
}