import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ThemeService } from '../../core/services/theme-service';
@Component({
  selector: 'app-pricing',
  imports: [RouterLink ],
  templateUrl: './pricing.html',
  styleUrl: './pricing.scss',
})
export class Pricing {
  themeService = new ThemeService();
  private router = inject(Router);
}
