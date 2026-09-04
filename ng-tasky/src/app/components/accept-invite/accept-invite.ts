import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BoardService } from '../../core/services/board-service';

@Component({
  selector: 'app-accept-invite',
  imports: [CommonModule],
  templateUrl: './accept-invite.html',
})
export class AcceptInvite implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private boardService = inject(BoardService);

  status = signal<'loading' | 'success' | 'error'>('loading');
  errorMessage = signal('');

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.status.set('error');
      this.errorMessage.set('Lien invalide.');
      return;
    }

    this.boardService.acceptInvite(token).subscribe({
      next: (res: any) => {
        this.status.set('success');
        
        const targetBoardId = res?.boardId;
        setTimeout(() => {
          if (targetBoardId) {
            this.router.navigate(['/board', targetBoardId]);
          } else {
            this.router.navigate(['/dashboard-user']);
          }
        }, 1500);
      },
      error: (err) => {
        this.status.set('error');
        this.errorMessage.set(err.error?.message || "Impossible d'accepter l'invitation.");
      },
    });
  }
}