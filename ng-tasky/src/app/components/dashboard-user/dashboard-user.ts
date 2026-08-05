import { Component, inject, ViewChild, computed, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { TacheCard } from '../tache-card/tache-card';

@Component({
  selector: 'app-dashboard-user',
  imports: [TacheCard, RouterLink],
  templateUrl: './dashboard-user.html',
  styleUrl: './dashboard-user.scss',
})
export class DashboardUser {
  private router = inject(Router);

  @ViewChild(TacheCard) tacheCard!: TacheCard;

  userName = 'there';

  get totalTasks(): number {
    return (this.tacheCard?.todo.length ?? 0) + (this.tacheCard?.done.length ?? 0);
  }
  get inProgressCount(): number {
    return this.tacheCard?.todo.length ?? 0;
  }
  get completedCount(): number {
    return this.tacheCard?.done.length ?? 0;
  }

  OpenAddTask() {
    this.router.navigate(['/add-task']);
  }

}