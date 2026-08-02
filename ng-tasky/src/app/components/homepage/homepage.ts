import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth-service';
import { ThemeService } from '../../core/services/theme-service';
@Component({
  selector: 'app-homepage',
  imports: [RouterLink],
  templateUrl: './homepage.html',
  styleUrl: './homepage.scss',
})
export class Homepage {
  private router = inject(Router);
  private authService = inject(AuthService);
 themeService = inject(ThemeService);
  isLoggedIn = this.authService.isLoggedIn();
  userName = 'there'; 
  OpenLogin(): void {
    this.router.navigate(['/login']);
  }

  OpenSignup(): void {
    this.router.navigate(['/signup']);
  }
}