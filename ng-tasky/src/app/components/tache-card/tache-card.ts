import { Component, OnInit, inject, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CdkDrag, CdkDragDrop, CdkDropList, CdkDropListGroup,
  moveItemInArray, transferArrayItem,
} from '@angular/cdk/drag-drop';
import { BoardService, Board } from '../../core/services/board-service';
import { ListService, TaskList } from '../../core/services/list.service';
import { TaskService, Task } from '../../core/services/task.service';
import { InviteMembers } from '../invite-members/invite-members';

@Component({
  selector: 'app-tache-card',
  imports: [CommonModule, FormsModule, CdkDropListGroup, CdkDropList, CdkDrag, InviteMembers],
  templateUrl: './tache-card.html',
  styleUrl: './tache-card.scss',
})
export class TacheCard implements OnInit {
  private boardService = inject(BoardService);
  private listService = inject(ListService);
  private taskService = inject(TaskService);
  private platformId = inject(PLATFORM_ID);

  board = signal<Board | null>(null);
  lists = signal<TaskList[]>([]);
  tasksByList = signal<Record<string, Task[]>>({});

  newListTitle = '';
  showInviteModal = signal(false);
  showAddInput: Record<string, boolean> = {};
  newTaskTitles: Record<string, string> = {};

  get todo(): Task[] {
    return this.allTasks().filter((t) => !this.isLastList(t.list));
  }
  get done(): Task[] {
    return this.allTasks().filter((t) => this.isLastList(t.list));
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.loadBoard();
  }

  loadBoard(): void {
    this.boardService.getMyBoard().subscribe((board) => {
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
    });
  }

  private allTasks(): Task[] {
    return Object.values(this.tasksByList()).flat();
  }

  private isLastList(listId: string): boolean {
    const lists = this.lists();
    return lists.length > 0 && lists[lists.length - 1]._id === listId;
  }

  tasksOf(listId: string): Task[] {
    return this.tasksByList()[listId] ?? [];
  }

  connectedLists(): string[] {
    return this.lists().map((l) => l._id);
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

    // Recalcule l'ordre local puis persiste le déplacement côté serveur
    event.container.data.forEach((t, index) => (t.order = index));
    this.taskService.moveTask(board._id, task._id, targetListId, event.currentIndex).subscribe();
  }

  toggleAddInput(listId: string): void {
    this.showAddInput[listId] = !this.showAddInput[listId];
  }

  addTask(listId: string): void {
    const title = (this.newTaskTitles[listId] || '').trim();
    const board = this.board();
    if (!title || !board) return;

    this.taskService.createTask(board._id, listId, title).subscribe((task) => {
      const grouped = { ...this.tasksByList() };
      grouped[listId] = [...(grouped[listId] ?? []), task];
      this.tasksByList.set(grouped);
      this.newTaskTitles[listId] = '';
      this.showAddInput[listId] = false;
    });
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
 // Pour supprimer la liste et toutes ses tâches associés
  deleteList(listId: string): void {
    const board = this.board();
    if (!board) return;
    if (!confirm('Supprimer cette liste et toutes ses tâches ?')) return;
    this.listService.deleteList(board._id, listId).subscribe(() => {
      this.lists.set(this.lists().filter((l) => l._id !== listId));
      const grouped = { ...this.tasksByList() };
      delete grouped[listId];
      this.tasksByList.set(grouped);
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
}