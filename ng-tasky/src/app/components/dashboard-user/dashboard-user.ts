import { Component, OnInit, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TacheCard } from '../tache-card/tache-card';
import { UserService } from '../../core/services/user-service';

@Component({
  selector: 'app-dashboard-user',
  imports: [TacheCard, RouterLink],
  templateUrl: './dashboard-user.html',
  styleUrl: './dashboard-user.scss',
})
export class DashboardUser implements OnInit {
  private userService = inject(UserService);
  private platformId = inject(PLATFORM_ID);

  userName = signal('there');

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.userService.getMe().subscribe((user) => {
      this.userName.set(user.first_name || user.email);
    });
  }
}