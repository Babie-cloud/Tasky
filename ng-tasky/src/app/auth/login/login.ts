import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth-service';

@Component({
  selector: 'app-login',
  imports: [RouterLink, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './login.html',
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  onSubmit(): void {
    console.log('[Login] onSubmit déclenché');

    if (this.loginForm.invalid || this.isSubmitting()) {
      console.warn('[Login] Soumission bloquée : formulaire invalide ou déjà en cours');
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.value;

    this.authService.login({ email, password }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard-user';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        console.error('[Login] Erreur de connexion', err);
        this.errorMessage.set(
          err.status === 401
            ? 'Incorrect email or password.'
            : 'Something went wrong. Please try again.'
        );
      },
    });
  }
}