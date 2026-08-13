import { Component, OnInit, inject, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import {
  CdkDrag, CdkDragDrop, CdkDropList, CdkDropListGroup,
  moveItemInArray, transferArrayItem,
} from '@angular/cdk/drag-drop';
import { BoardService, Board } from '../../core/services/board-service';
import { ListService, TaskList } from '../../core/services/list.service';
import { TaskService, Task } from '../../core/services/task.service';
import { InviteMembers } from '../invite-members/invite-members';
import { TaskDetail } from '../task-detail/task-detail';

@Component({
  selector: 'app-tache-card',
  imports: [CommonModule, FormsModule, RouterLink, CdkDropListGroup, CdkDropList, CdkDrag, InviteMembers, TaskDetail],
  templateUrl: './tache-card.html',
  styleUrl: './tache-card.scss',
})
export class TacheCard implements OnInit {
  private boardService = inject(BoardService);
  private listService = inject(ListService);
  private taskService = inject(TaskService);
  private platformId = inject(PLATFORM_ID);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  board = signal<Board | null>(null);
  lists = signal<TaskList[]>([]);
  tasksByList = signal<Record<string, Task[]>>({});

  showInviteModal = signal(false);
  newListTitle = '';

  filterDueStatus: 'all' | 'overdue' | 'today' | 'week' = 'all';
  filterAssignee = 'all';
  searchText = '';

  selectedTask = signal<Task | null>(null);

  private boardId = '';

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.boardId = this.route.snapshot.paramMap.get('boardId') || '';
    if (!this.boardId) {
      this.router.navigate(['/dashboard-user']);
      return;
    }
    this.loadBoard();
  }

  loadBoard(): void {
    this.boardService.getBoard(this.boardId).subscribe({
      next: (board) => {
        this.board.set(board);
        this.listService.getLists(board._id).subscribe((lists) => {
          this.lists.set(lists);
          this.taskService.getTasks(board._id).subscribe((tasks) => {
            const grouped: Record<string, Task[]> = {};
            for (const list of lists) grouped[list._id] = [];
            for (const task of tasks) {
              if (!grouped[task.list]) grouped[task.list] = [];
              grouped[task.list].push(task);
            }
            for (const key of Object.keys(grouped)) {
              grouped[key].sort((a, b) => a.order - b.order);
            }
            this.tasksByList.set(grouped);
          });
        });
      },
      error: () => this.router.navigate(['/dashboard-user']),
    });
  }

  private listAt(index: number): TaskList | undefined {
    return this.lists()[index];
  }

  get totalCount(): number {
    return Object.values(this.tasksByList()).reduce((sum, arr) => sum + arr.length, 0);
  }
  get inProgressCount(): number {
    const todo = this.listAt(0);
    const inProgress = this.listAt(1);
    return (
      (todo ? this.tasksOf(todo._id).length : 0) +
      (inProgress ? this.tasksOf(inProgress._id).length : 0)
    );
  }
  get completedCount(): number {
    const done = this.listAt(2);
    return done ? this.tasksOf(done._id).length : 0;
  }

  tasksOf(listId: string): Task[] {
    return this.tasksByList()[listId] ?? [];
  }

  connectedLists(): string[] {
    return this.lists().map((l) => l._id);
  }

  taskVisible(task: Task): boolean {
    if (this.filterAssignee !== 'all' && (task.assignedTo || '') !== this.filterAssignee) {
      return false;
    }
    if (this.searchText.trim()) {
      const needle = this.searchText.trim().toLowerCase();
      if (!task.title.toLowerCase().includes(needle)) return false;
    }
    if (this.filterDueStatus !== 'all') {
      const badge = this.dueBadge(task);
      const labelByFilter: Record<string, string> = {
        overdue: 'En retard',
        today: "Aujourd'hui",
        week: 'Cette semaine',
      };
      if (!badge || badge.label !== labelByFilter[this.filterDueStatus]) return false;
    }
    return true;
  }

  drop(event: CdkDragDrop<Task[]>, targetListId: string): void {
    const task = event.previousContainer.data[event.previousIndex];
    const board = this.board();
    if (!board) return;

    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }

    event.container.data.forEach((t, index) => (t.order = index));
    this.taskService.moveTask(board._id, task._id, targetListId, event.currentIndex).subscribe();
  }

  deleteTask(taskId: string, listId: string): void {
    const board = this.board();
    if (!board) return;
    this.taskService.deleteTask(board._id, taskId).subscribe(() => {
      const grouped = { ...this.tasksByList() };
      grouped[listId] = (grouped[listId] ?? []).filter((t) => t._id !== taskId);
      this.tasksByList.set(grouped);
    });
  }

  addList(): void {
    const board = this.board();
    const title = this.newListTitle.trim();
    if (!title || !board) return;
    this.listService.createList(board._id, title).subscribe((list) => {
      this.lists.set([...this.lists(), list]);
      const grouped = { ...this.tasksByList() };
      grouped[list._id] = [];
      this.tasksByList.set(grouped);
      this.newListTitle = '';
    });
  }

  dueBadge(task: Task): { label: string; class: string } | null {
    if (!task.dueDate) return null;
    const due = new Date(task.dueDate);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    const diffDays = Math.round((startOfDue.getTime() - startOfToday.getTime()) / 86400000);

    if (diffDays < 0) return { label: 'En retard', class: 'bg-danger' };
    if (diffDays === 0) return { label: "Aujourd'hui", class: 'bg-warning text-dark' };
    if (diffDays <= 7) return { label: 'Cette semaine', class: 'bg-info text-dark' };
    return { label: due.toLocaleDateString('fr-FR'), class: 'bg-secondary' };
  }

  assigneeInitials(task: Task): string | null {
    if (!task.assignedTo) return null;
    const board = this.board();
    const member = board?.members.find((m) => m.user?._id === task.assignedTo);
    if (!member?.user) return null;
    const first = member.user.first_name?.[0] || member.user.email[0];
    const last = member.user.last_name?.[0] || '';
    return (first + last).toUpperCase();
  }

  openTask(task: Task): void {
    this.selectedTask.set(task);
  }

  closeTaskDetail(): void {
    this.selectedTask.set(null);
  }

  onTaskUpdated(updated: Task): void {
    const grouped = { ...this.tasksByList() };
    for (const listId of Object.keys(grouped)) {
      grouped[listId] = grouped[listId].map((t) => (t._id === updated._id ? updated : t));
    }
    this.tasksByList.set(grouped);
    this.selectedTask.set(null);
  }

  onTaskDeleted(taskId: string): void {
    const grouped = { ...this.tasksByList() };
    for (const listId of Object.keys(grouped)) {
      grouped[listId] = grouped[listId].filter((t) => t._id !== taskId);
    }
    this.tasksByList.set(grouped);
    this.selectedTask.set(null);
  }
}