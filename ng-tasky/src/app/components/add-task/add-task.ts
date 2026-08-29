import { Component, inject, signal, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../core/services/task.service';
import { CategoryService, Category } from '../../core/services/category-service';

@Component({
  selector: 'app-add-task',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './add-task.html',
})
export class AddTask implements OnInit {
  private fb = inject(FormBuilder);
  private taskService = inject(TaskService);
  private categoryService = inject(CategoryService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  form: FormGroup = this.fb.group({
    title: ['', Validators.required],
    dueDate: [''],
  });

  categories = signal<Category[]>([]);
  selectedCategoryIds = signal<Set<string>>(new Set());
  isSubmitting = signal(false);
  boardId = '';

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.boardId = this.route.snapshot.paramMap.get('boardId') || '';
    if (!this.boardId) {
      this.router.navigate(['/dashboard-user']);
      return;
    }

    this.categoryService.getCategories(this.boardId).subscribe((categories) => {
      this.categories.set(categories);
    });
  }

  toggleCategory(categoryId: string): void {
    const current = new Set(this.selectedCategoryIds());
    if (current.has(categoryId)) {
      current.delete(categoryId);
    } else {
      current.add(categoryId);
    }
    this.selectedCategoryIds.set(current);
  }

  isSelected(categoryId: string): boolean {
    return this.selectedCategoryIds().has(categoryId);
  }

  onSubmit(): void {
    if (this.form.invalid || !this.boardId) return;
    this.isSubmitting.set(true);
    const { title, dueDate } = this.form.value;
    const categoryIds = Array.from(this.selectedCategoryIds());

    this.taskService.createTask(this.boardId, title, dueDate || null, categoryIds).subscribe({
      next: () => this.router.navigate(['/board', this.boardId]),
      error: () => this.isSubmitting.set(false),
    });
  }
}