import { Component, OnInit, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UserService, UserProfile } from '../../core/services/user-service';
import { AuthService } from '../../core/services/auth-service';
import { BoardService, Board, BoardMember } from '../../core/services/board-service';
import { BillingService, BillingStatus } from '../../core/services/billing-service';
import { ThemeService } from '../../core/services/theme-service';
import { TaskService, Task } from '../../core/services/task.service';
import { CategoryManager } from '../category-manager/category-manager';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule, RouterLink, CategoryManager],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private boardService = inject(BoardService);
  private billingService = inject(BillingService);
  private taskService = inject(TaskService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private platformId = inject(PLATFORM_ID);
  themeService = inject(ThemeService);

  user = signal<UserProfile | null>(null);
  boards = signal<Board[]>([]);
  myTasks = signal<Task[]>([]);
  isLoadingBoards = signal(false);
  isLoadingTasks = signal(false);

  activeTab = signal<'info' | 'cards' | 'myBoards' | 'team' | 'billing' | 'settings'>('info');
  cardsSubTab = signal<'tasks' | 'categories'>('tasks');
  selectedBoardForCategories = signal<string>('');

  isRemovingMember = signal<string | null>(null);

  // Sécurité — Afficher / Masquer mot de passe
  showCurrentPassword = signal(false);
  showNewPassword = signal(false);
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  isChangingPassword = signal(false);
  passwordMessage = signal<string | null>(null);
  passwordError = signal<string | null>(null);

  // Préférences de notification email
  notifyOnInvite = true;
  notifyOnRemoval = true;
  isSavingNotifications = signal(false);
  notificationsMessage = signal<string | null>(null);

  // Zone dangereuse
  deleteConfirmText = '';
  isDeletingAccount = signal(false);
  deleteError = signal<string | null>(null);

  // Facturation
  billingStatus = signal<BillingStatus | null>(null);
  isLoadingBilling = signal(false);
  isOpeningPortal = signal(false);
  showPaymentSuccess = signal(false);

  // Formulaire d'information
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

      this.notifyOnInvite = (user as any).notifyOnInvite ?? true;
      this.notifyOnRemoval = (user as any).notifyOnRemoval ?? true;
    });

    this.loadBoards();

    const params = this.route.snapshot.queryParams;
    if (params['tab'] === 'billing') {
      this.activeTab.set('billing');
      this.loadBillingStatus();
      if (params['success'] === 'true') {
        this.showPaymentSuccess.set(true);
      }
    }
  }

  setTab(tab: 'info' | 'cards' | 'myBoards' | 'team' | 'billing' | 'settings'): void {
    this.activeTab.set(tab);
    if (tab === 'myBoards' || tab === 'team') {
      this.loadBoards();
    }
    if (tab === 'cards') {
      this.loadBoards();
      this.loadMyTasks();
    }
    if (tab === 'billing') {
      this.loadBillingStatus();
    }
  }

  loadMyTasks(): void {
    this.isLoadingTasks.set(true);
    this.taskService.getMyTasks().subscribe({
      next: (tasks) => {
        this.myTasks.set(tasks);
        this.isLoadingTasks.set(false);
      },
      error: () => this.isLoadingTasks.set(false),
    });
  }

  dueBadge(task: Task): { label: string; class: string } | null {
    if (!task.dueDate) return null;
    const due = new Date(task.dueDate);
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 3600 * 24));

    if (diffDays < 0) return { label: 'En retard', class: 'bg-danger-subtle text-danger' };
    if (diffDays === 0) return { label: "Aujourd'hui", class: 'bg-warning-subtle text-warning' };
    return { label: `J-${diffDays}`, class: 'bg-info-subtle text-info' };
  }

  loadBillingStatus(): void {
    this.isLoadingBilling.set(true);
    this.billingService.getStatus().subscribe({
      next: (status) => {
        this.billingStatus.set(status);
        this.isLoadingBilling.set(false);
      },
      error: () => this.isLoadingBilling.set(false),
    });
  }

  openBillingPortal(): void {
    this.isOpeningPortal.set(true);
    this.billingService.createPortalSession().subscribe({
      next: (res) => (window.location.href = res.url),
      error: () => this.isOpeningPortal.set(false),
    });
  }

  planLabel(plan: string | undefined): string {
    switch (plan) {
      case 'pro':
        return 'Pro';
      case 'enterprise':
        return 'Enterprise';
      default:
        return 'Free';
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

  ownedBoards(): Board[] {
    return this.boards().filter((b) => this.isOwnerOf(b));
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

  roleOn(board: Board): string {
    if (board.owner._id === this.currentUserId) return 'admin';
    const member = board.members.find((m) => m.user?._id === this.currentUserId);
    return member?.role ?? 'observer';
  }

  isOwnerOf(board: Board): boolean {
    return board.owner._id === this.currentUserId;
  }

  isAdminOf(board: Board): boolean {
    if (board.owner._id === this.currentUserId) return true;
    const member = board.members.find((m) => m.user?._id === this.currentUserId);
    return member?.role === 'admin';
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

  memberInitials(member: BoardMember): string {
    const first = member.user?.first_name?.[0] || member.email?.[0] || '?';
    const last = member.user?.last_name?.[0] || '';
    return (first + last).toUpperCase();
  }

  deactivateMember(board: Board, member: BoardMember): void {
    const label = member.user?.first_name || member.email;
    const confirmed = window.confirm(
      `Retirer ${label} du tableau "${board.name}" ? Un email lui sera envoyé pour l'en informer.`
    );
    if (!confirmed) return;

    this.isRemovingMember.set(member._id);
    this.boardService.removeMember(board._id, member._id).subscribe({
      next: () => {
        this.boards.update((boards) =>
          boards.map((b) =>
            b._id === board._id
              ? { ...b, members: b.members.filter((m) => m._id !== member._id) }
              : b
          )
        );
        this.isRemovingMember.set(null);
      },
      error: () => {
        this.isRemovingMember.set(null);
        window.alert("Impossible de retirer ce membre pour l'instant.");
      },
    });
  }

  toggleCurrentPassword(): void {
    this.showCurrentPassword.update((val) => !val);
  }

  toggleNewPassword(): void {
    this.showNewPassword.update((val) => !val);
  }

  changePassword(): void {
    this.passwordError.set(null);
    this.passwordMessage.set(null);

    if (!this.currentPassword || !this.newPassword) {
      this.passwordError.set('Renseigne ton mot de passe actuel et le nouveau.');
      return;
    }
    if (this.newPassword.length < 8) {
      this.passwordError.set('Le nouveau mot de passe doit faire au moins 8 caractères.');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.passwordError.set('La confirmation ne correspond pas au nouveau mot de passe.');
      return;
    }

    this.isChangingPassword.set(true);
    this.userService.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.isChangingPassword.set(false);
        this.passwordMessage.set('Mot de passe mis à jour.');
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
      },
      error: (err) => {
        this.isChangingPassword.set(false);
        this.passwordError.set(err.error?.message || 'Mot de passe actuel incorrect.');
      },
    });
  }

  saveNotificationPrefs(): void {
    this.isSavingNotifications.set(true);
    this.notificationsMessage.set(null);
    this.userService
      .updateNotificationPrefs({
        notifyOnInvite: this.notifyOnInvite,
        notifyOnRemoval: this.notifyOnRemoval,
      })
      .subscribe({
        next: () => {
          this.isSavingNotifications.set(false);
          this.notificationsMessage.set('Préférences enregistrées.');
        },
        error: () => {
          this.isSavingNotifications.set(false);
          this.notificationsMessage.set("Erreur lors de l'enregistrement.");
        },
      });
  }

  get canDeleteAccount(): boolean {
    return this.deleteConfirmText.trim().toUpperCase() === 'SUPPRIMER';
  }

  deleteAccount(): void {
    if (!this.canDeleteAccount) return;
    this.deleteError.set(null);
    this.isDeletingAccount.set(true);

    this.userService.deleteAccount().subscribe({
      next: () => {
        this.authService.logout();
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isDeletingAccount.set(false);
        this.deleteError.set(err.error?.message || 'Erreur lors de la suppression du compte.');
      },
    });
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