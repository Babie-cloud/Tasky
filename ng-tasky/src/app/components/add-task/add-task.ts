import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../core/services/task.service';
import { BoardService, Board } from '../../core/services/board-service';
import { ListService } from '../../core/services/list.service';

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

  form: FormGroup = this.fb.group({
    title: ['', Validators.required],
    board: ['', Validators.required],
    dueDate: [''],
  });

  boards = signal<Board[]>([]);
  isSubmitting = signal(false);

  ngOnInit(): void {
    this.boardService.getBoards().subscribe((boards) => {
      this.boards.set(boards);
      if (boards.length) this.form.patchValue({ board: boards[0]._id });
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.isSubmitting.set(true);
    const { title, board, dueDate } = this.form.value;

    // La tâche est toujours déposée dans la 1ère liste du tableau choisi ("À faire")
    this.listService.getLists(board).subscribe((lists) => {
      const firstList = lists[0];
      if (!firstList) {
        this.isSubmitting.set(false);
        return;
      }
      this.taskService.createTask(board, firstList._id, title, dueDate || null).subscribe({
        next: () => this.router.navigate(['/boards', board]),
        error: () => this.isSubmitting.set(false),
      });
    });
  }
}