import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth-service';

@Component({
  selector: 'app-homepage',
  imports: [RouterLink],
  templateUrl: './homepage.html',
  styleUrl: './homepage.scss',
})
export class Homepage {
  private router = inject(Router);
  private authService = inject(AuthService);

  isLoggedIn = this.authService.isLoggedIn();
  userName = 'there'; // à remplacer une fois le prénom disponible dans AuthService

  OpenLogin(): void {
    this.router.navigate(['/login']);
  }

  OpenSignup(): void {
    this.router.navigate(['/signup']);
  }
}