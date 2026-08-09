import { Component, OnInit, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService, UserProfile } from '../../core/services/user-service';
import { AuthService } from '../../core/services/auth-service';
import { BoardService, Board } from '../../core/services/board-service';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private boardService = inject(BoardService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  user = signal<UserProfile | null>(null);
  board = signal<Board | null>(null);
  activeTab = signal<'info' | 'cards' | 'members' | 'billing'>('info');

  firstName = '';
  lastName = '';
  isSaving = signal(false);
  saveMessage = signal<string | null>(null);

  private currentUserId = '';

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.userService.getMe().subscribe((user) => {
      this.user.set(user);
      this.currentUserId = user._id;
      this.firstName = user.first_name || '';
      this.lastName = user.last_name || '';
    });

    this.boardService.getMyBoard().subscribe((board) => this.board.set(board));
  }

  setTab(tab: 'info' | 'cards' | 'members' | 'billing'): void {
    this.activeTab.set(tab);
    if (tab === 'members') {
      this.refreshBoard();
    }
  }

  refreshBoard(): void {
    this.boardService.getMyBoard().subscribe((board) => this.board.set(board));
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

  isAdmin(): boolean {
    const board = this.board();
    if (!board) return false;
    if (board.owner._id === this.currentUserId) return true;
    const member = board.members.find((m) => m.user?._id === this.currentUserId);
    return member?.role === 'admin';
  }

  // Vrai si l'utilisateur connecté est un collaborateur (pas le propriétaire) du tableau
  get isCollaborator(): boolean {
    const board = this.board();
    return !!board && board.owner._id !== this.currentUserId && !!this.currentUserId;
  }

  // Le rôle de l'utilisateur connecté sur ce tableau
  get myRole(): string | null {
    const board = this.board();
    if (!board) return null;
    if (board.owner._id === this.currentUserId) return 'admin';
    const member = board.members.find((m) => m.user?._id === this.currentUserId);
    return member?.role ?? null;
  }

  get ownerName(): string {
    const board = this.board();
    if (!board) return '';
    const o = board.owner;
    return `${o.first_name || ''} ${o.last_name || ''}`.trim() || o.email;
  }

  roleLabel(role: string | null): string {
    switch (role) {
      case 'admin':
        return 'Administrateur';
      case 'member':
        return 'Membre';
      case 'observer':
        return 'Observateur';
      default:
        return '';
    }
  }

  changeRole(memberId: string, role: string): void {
    const board = this.board();
    if (!board) return;
    this.boardService
      .changeMemberRole(board._id, memberId, role)
      .subscribe((updated) => this.board.set(updated));
  }

  removeMember(memberId: string): void {
    const board = this.board();
    if (!board) return;
    if (!confirm('Retirer ce membre du tableau ?')) return;
    this.boardService.removeMember(board._id, memberId).subscribe((updated) => this.board.set(updated));
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