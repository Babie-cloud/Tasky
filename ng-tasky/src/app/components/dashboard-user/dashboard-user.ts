import { Component, inject, OnInit, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { BoardService, Board } from '../../core/services/board-service';

@Component({
  selector: 'app-dashboard-user',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterLink
  ],
  templateUrl: './dashboard-user.html',
  styleUrl: './dashboard-user.scss',
})
export class DashboardUser implements OnInit {
  private boardService = inject(BoardService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID); 

  boards = signal<Board[]>([]);
  newBoardName = '';
  isCreating = signal(false);
  userName = 'there';

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadBoards();
    }
  }

  loadBoards(): void {
    this.boardService.getBoards().subscribe({
      next: (boards: Board[]) => this.boards.set(boards),
      error: (err: unknown) => console.error('Erreur chargement tableaux:', err)
    });
  }

  createBoard(): void {
    const name = this.newBoardName.trim();
    if (!name) return;
    this.isCreating.set(true);
    this.boardService.createBoard(name).subscribe({
      next: (board: Board) => {
        this.isCreating.set(false);
        this.newBoardName = '';
        this.router.navigate(['/boards', board._id]);
      },
      error: () => this.isCreating.set(false),
    });
  }

  openBoard(boardId: string): void {
    this.router.navigate(['/boards', boardId]);
  }
}