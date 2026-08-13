import { Component, OnInit, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { BoardService, Board } from '../../core/services/board-service';
import { UserService } from '../../core/services/user-service';
import { ThemeService } from '../../core/services/theme-service';

@Component({
  selector: 'app-dashboard-user',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dashboard-user.html',
  styleUrl: './dashboard-user.scss',
})
export class DashboardUser implements OnInit {
  private boardService = inject(BoardService);
  private userService = inject(UserService);
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);
  themeService = new ThemeService();

  userName = signal('there');
  boards = signal<Board[]>([]);
  isLoading = signal(true);
  newBoardName = '';
  isCreating = signal(false);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.userService.getMe().subscribe((user) => {
      this.userName.set(user.first_name || user.email);
    });

    this.loadBoards();
  }

  loadBoards(): void {
    this.isLoading.set(true);
    this.boardService.getMyBoards().subscribe({
      next: (boards) => {
        this.boards.set(boards);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  createBoard(): void {
    const name = this.newBoardName.trim();
    if (!name || this.isCreating()) return;
    this.isCreating.set(true);
    this.boardService.createBoard(name).subscribe({
      next: (board) => {
        this.isCreating.set(false);
        this.newBoardName = '';
        this.router.navigate(['/board', board._id]);
      },
      error: () => this.isCreating.set(false),
    });
  }

  openBoard(boardId: string): void {
    this.router.navigate(['/board', boardId]);
  }
}