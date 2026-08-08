import { Component, OnInit, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TacheCard } from '../tache-card/tache-card';
import { UserService } from '../../core/services/user-service';
import { ThemeService } from '../../core/services/theme-service';

@Component({
  selector: 'app-dashboard-user',
  imports: [TacheCard, RouterLink],
  templateUrl: './dashboard-user.html',
  styleUrl: './dashboard-user.scss',
})
export class DashboardUser implements OnInit {
  private userService = inject(UserService);
  private platformId = inject(PLATFORM_ID);
    themeService = new ThemeService();
   private router = inject(Router);

  userName = signal('there');

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.userService.getMe().subscribe((user) => {
      this.userName.set(user.first_name || user.email);
    });
  }
}