import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService, UserProfile } from '../../core/services/user-service';
import { AuthService } from '../../core/services/auth-service';
import { BoardService, Board } from '../../core/services/board-service';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
})
export class Profile implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private boardService = inject(BoardService);
  private router = inject(Router);

  user = signal<UserProfile | null>(null);
  board = signal<Board | null>(null);

  firstName = '';
  lastName = '';
  isSaving = signal(false);
  saveMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.userService.getMe().subscribe((user) => {
      this.user.set(user);
      this.firstName = user.first_name || '';
      this.lastName = user.last_name || '';
    });

    // Typage explicite du paramètre (board: Board)
    this.boardService.getMyBoard().subscribe((board: Board) => {
      this.board.set(board);
    });
  }

  saveProfile(): void {
    this.isSaving.set(true);
    this.saveMessage.set(null);
    this.userService
      .updateMe({ first_name: this.firstName, last_name: this.lastName })
      .subscribe({
        next: (user) => {
          this.user.set(user);
          this.isSaving.set(false);
          this.saveMessage.set('Profil mis à jour.');
        },
        error: () => {
          this.isSaving.set(false);
          this.saveMessage.set('Erreur lors de la mise à jour.');
        },
      });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  initials(): string {
    const user = this.user();
    if (!user) return '';
    const first = user.first_name?.[0] || user.email[0];
    const last = user.last_name?.[0] || '';
    return (first + last).toUpperCase();
  }
}