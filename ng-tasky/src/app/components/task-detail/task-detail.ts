import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService, Task } from '../../core/services/task.service';
import { BoardMember } from '../../core/services/board-service';

@Component({
  selector: 'app-task-detail',
  imports: [CommonModule, FormsModule],
  templateUrl: './task-detail.html',
})
export class TaskDetail implements OnChanges {
  @Input() task: Task | null = null;
  @Input() boardId = '';
  @Input() members: BoardMember[] = [];
  @Output() closed = new EventEmitter<void>();
  @Output() updated = new EventEmitter<Task>();
  @Output() deleted = new EventEmitter<string>();

  private taskService = inject(TaskService);

  title = '';
  description = '';
  dueDate = '';
  assignedTo = '';
  isSaving = signal(false);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['task'] && this.task) {
      this.title = this.task.title;
      this.description = this.task.description || '';
      this.dueDate = this.task.dueDate ? this.task.dueDate.substring(0, 10) : '';
      this.assignedTo = this.task.assignedTo || '';
    }
  }

  assigneeLabel(member: BoardMember): string {
    const name = `${member.user?.first_name || ''} ${member.user?.last_name || ''}`.trim();
    return name || member.email;
  }

  save(): void {
    if (!this.task || !this.boardId) return;
    this.isSaving.set(true);
    this.taskService
      .updateTask(this.boardId, this.task._id, {
        title: this.title,
        description: this.description,
        dueDate: this.dueDate || null,
        assignedTo: this.assignedTo || null,
      })
      .subscribe((updatedTask) => {
        this.isSaving.set(false);
        this.updated.emit(updatedTask);
      });
  }

  remove(): void {
    if (!this.task || !this.boardId) return;
    if (!confirm('Supprimer cette tâche ?')) return;
    const taskId = this.task._id;
    this.taskService.deleteTask(this.boardId, taskId).subscribe(() => {
      this.deleted.emit(taskId);
    });
  }

  close(): void {
    this.closed.emit();
  }
}