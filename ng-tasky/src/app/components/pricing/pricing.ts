import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ThemeService } from '../../core/services/theme-service';
import { BillingService } from '../../core/services/billing-service';
import { AuthService } from '../../core/services/auth-service';

@Component({
  selector: 'app-pricing',
  imports: [CommonModule, RouterLink],
  templateUrl: './pricing.html',
  styleUrl: './pricing.scss',
})
export class Pricing {
  themeService = new ThemeService();
  private router = inject(Router);
  private billingService = inject(BillingService);
  private authService = inject(AuthService);

  loadingPlan = signal<'pro' | 'enterprise' | null>(null);
  errorMessage = signal<string | null>(null);

  subscribe(plan: 'pro' | 'enterprise'): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/pricing' } });
      return;
    }

    this.loadingPlan.set(plan);
    this.errorMessage.set(null);
    this.billingService.createCheckoutSession(plan).subscribe({
      next: (res) => {
        window.location.href = res.url;
      },
      error: () => {
        this.loadingPlan.set(null);
        this.errorMessage.set("Impossible de démarrer le paiement. Réessaie plus tard.");
      },
    });
  }
}