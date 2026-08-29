import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService, Category } from '../../core/services/category-service';

@Component({
  selector: 'app-category-manager',
  imports: [CommonModule, FormsModule],
  templateUrl: './category-manager.html',
  styleUrl: './category-manager.scss',
})
export class CategoryManager implements OnInit {
  @Input({ required: true }) boardId!: string;
  @Input() readonly = false;

  private categoryService = inject(CategoryService);

  categories = signal<Category[]>([]);
  isLoading = signal(false);

  newName = '';
  newColor = '#2eb85c';
  isCreating = signal(false);

  editingId = signal<string | null>(null);
  editName = '';
  editColor = '';

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading.set(true);
    this.categoryService.getCategories(this.boardId).subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  createCategory(): void {
    const name = this.newName.trim();
    if (!name || this.isCreating()) return;
    this.isCreating.set(true);
    this.categoryService.createCategory(this.boardId, name, this.newColor).subscribe({
      next: (category) => {
        this.categories.set([...this.categories(), category]);
        this.newName = '';
        this.newColor = '#2eb85c';
        this.isCreating.set(false);
      },
      error: () => this.isCreating.set(false),
    });
  }

  startEdit(category: Category): void {
    this.editingId.set(category._id);
    this.editName = category.name;
    this.editColor = category.color;
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  saveEdit(categoryId: string): void {
    this.categoryService
      .updateCategory(this.boardId, categoryId, { name: this.editName.trim(), color: this.editColor })
      .subscribe((updated) => {
        this.categories.set(this.categories().map((c) => (c._id === updated._id ? updated : c)));
        this.editingId.set(null);
      });
  }

  deleteCategory(categoryId: string): void {
    if (!confirm('Supprimer cette catégorie ? Elle sera retirée de toutes les tâches concernées.')) return;
    this.categoryService.deleteCategory(this.boardId, categoryId).subscribe(() => {
      this.categories.set(this.categories().filter((c) => c._id !== categoryId));
    });
  }
}