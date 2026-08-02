import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TaskService } from '../../core/services/task-service';

@Component({
  selector: 'app-add-task',
  imports: [ReactiveFormsModule],
  templateUrl: './add-task.html',
})
export class AddTask {
  private fb = inject(FormBuilder);
  private taskService = inject(TaskService);
  private router = inject(Router);

  form: FormGroup = this.fb.group({
    title: ['', Validators.required],
  });

  isSubmitting = signal(false);

  onSubmit(): void {
    if (this.form.invalid) return;
    this.isSubmitting.set(true);
    this.taskService.createTask(this.form.value.title).subscribe({
      next: () => this.router.navigate(['/dashboard-user']),
      error: () => this.isSubmitting.set(false),
    });
  }
}