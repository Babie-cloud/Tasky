import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth-service';
import { ThemeService } from '../../core/services/theme-service';
import { Chatbot } from '../chatbot/chatbot';
@Component({
  selector: 'app-homepage',
  imports: [RouterLink, Chatbot],
  templateUrl: './homepage.html',
  styleUrl: './homepage.scss',
})
export class Homepage {
  themeService = inject(ThemeService);
      private authService = inject(AuthService);
      private router = inject(Router);
  isLoggedIn = this.authService.isLoggedIn();
  userName = 'there'; 
  Openpricing(): void {
  this.router.navigate(['/pricing']);
  }

  OpenSignup(): void {
    this.router.navigate(['/signup']);
  }
}