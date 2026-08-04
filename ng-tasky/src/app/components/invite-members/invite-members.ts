import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BoardService } from '../../core/services/board.service';

@Component({
  selector: 'app-invite-members',
  imports: [CommonModule, FormsModule],
  templateUrl: './invite-members.html',
})
export class InviteMembers {
  @Input() boardId = '';
  @Output() closed = new EventEmitter<void>();

  private boardService = inject(BoardService);

  email = '';
  role: 'admin' | 'member' | 'observer' = 'member';
  isSending = signal(false);
  message = signal<string | null>(null);
  error = signal<string | null>(null);

  send(): void {
    if (!this.email.trim() || !this.boardId) return;
    this.isSending.set(true);
    this.error.set(null);
    this.message.set(null);

    this.boardService.invite(this.boardId, this.email.trim(), this.role).subscribe({
      next: () => {
        this.isSending.set(false);
        this.message.set('Invitation envoyée !');
        this.email = '';
      },
      error: (err) => {
        this.isSending.set(false);
        this.error.set(err.error?.message || "Erreur lors de l'envoi de l'invitation.");
      },
    });
  }

  close(): void {
    this.closed.emit();
  }
}