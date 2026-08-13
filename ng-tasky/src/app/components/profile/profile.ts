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
  boards = signal<Board[]>([]);
  isLoadingBoards = signal(false);
  activeTab = signal<'info' | 'cards' | 'members' | 'billing'>('info');

  firstName = '';
  lastName = '';
  phone = '';
  location = '';
  birthDate = '';
  bio = '';
  linkedIn = '';
  github = '';
  jobTitle = '';

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
      this.phone = user.phone || '';
      this.location = user.location || '';
      this.birthDate = user.birthDate ? user.birthDate.substring(0, 10) : '';
      this.bio = user.bio || '';
      this.linkedIn = user.linkedIn || '';
      this.github = user.github || '';
      this.jobTitle = user.jobTitle || '';
    });

    this.loadBoards();
  }

  setTab(tab: 'info' | 'cards' | 'members' | 'billing'): void {
    this.activeTab.set(tab);
    if (tab === 'members') {
      this.loadBoards();
    }
  }

  loadBoards(): void {
    this.isLoadingBoards.set(true);
    this.boardService.getMyBoards().subscribe({
      next: (boards) => {
        this.boards.set(boards);
        this.isLoadingBoards.set(false);
      },
      error: () => this.isLoadingBoards.set(false),
    });
  }

  saveProfile(): void {
    this.isSaving.set(true);
    this.saveMessage.set(null);
    this.userService
      .updateMe({
        first_name: this.firstName,
        last_name: this.lastName,
        phone: this.phone,
        location: this.location,
        birthDate: this.birthDate || null,
        bio: this.bio,
        linkedIn: this.linkedIn,
        github: this.github,
        jobTitle: this.jobTitle,
      })
      .subscribe({
        next: (user) => {
          this.user.set(user);
          this.isSaving.set(false);
          this.saveMessage.set('Profil mis à jour.');
        },
        error: (err) => {
          this.isSaving.set(false);
          this.saveMessage.set(err.error?.message || 'Erreur lors de la mise à jour.');
        },
      });
  }

  // Rôle de l'utilisateur connecté sur un board donné
  roleOn(board: Board): string {
    if (board.owner._id === this.currentUserId) return 'admin';
    const member = board.members.find((m) => m.user?._id === this.currentUserId);
    return member?.role ?? 'observer';
  }

  isOwnerOf(board: Board): boolean {
    return board.owner._id === this.currentUserId;
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

  openBoard(boardId: string): void {
    this.router.navigate(['/board', boardId]);
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