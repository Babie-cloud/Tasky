import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Task {
  _id: string;
  title: string;
  description?: string;
  board: string;
  list: string;
  order: number;
  dueDate?: string | null;
  createdBy: string;
  assignedTo?: string | null;
  categories?: string[];
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/tasks`;

  getTasks(boardId: string): Observable<Task[]> {
    return this.http.get<Task[]>(this.base, { params: { board: boardId } });
  }

  createTask(
    boardId: string,
    title: string,
    dueDate: string | null = null,
    categoryIds: string[] = []
  ): Observable<Task> {
    return this.http.post<Task>(this.base, {
      board: boardId,
      title,
      dueDate,
      categories: categoryIds,
    });
  }

  updateTask(boardId: string, taskId: string, data: Partial<Task>): Observable<Task> {
    return this.http.put<Task>(`${this.base}/${taskId}`, { board: boardId, ...data });
  }

  moveTask(boardId: string, taskId: string, listId: string, order: number): Observable<Task> {
    return this.http.put<Task>(`${this.base}/${taskId}/move`, { board: boardId, list: listId, order });
  }

  deleteTask(boardId: string, taskId: string): Observable<any> {
    return this.http.delete(`${this.base}/${taskId}`, { params: { board: boardId } });
  }
}