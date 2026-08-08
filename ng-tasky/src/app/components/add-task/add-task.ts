import { Component, inject, signal, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../core/services/task.service';
import { BoardService } from '../../core/services/board-service';
import { ListService, TaskList } from '../../core/services/list.service';

@Component({
  selector: 'app-add-task',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './add-task.html',
})
export class AddTask implements OnInit {
  private fb = inject(FormBuilder);
  private taskService = inject(TaskService);
  private boardService = inject(BoardService);
  private listService = inject(ListService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  form: FormGroup = this.fb.group({
    title: ['', Validators.required],
    list: ['', Validators.required],
    dueDate: [''],
  });

  lists = signal<TaskList[]>([]);
  isSubmitting = signal(false);
  private boardId = '';

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.boardService.getMyBoard().subscribe((board) => {
      this.boardId = board._id;
      this.listService.getLists(board._id).subscribe((lists) => {
        this.lists.set(lists);
        if (lists.length) this.form.patchValue({ list: lists[0]._id });
      });
    });
  }

  onSubmit(): void {
    if (this.form.invalid || !this.boardId) return;
    this.isSubmitting.set(true);
    const { title, list, dueDate } = this.form.value;
    this.taskService.createTask(this.boardId, list, title, dueDate || null).subscribe({
      next: () => this.router.navigate(['/dashboard-user']),
      error: () => this.isSubmitting.set(false),
    });
  }
}