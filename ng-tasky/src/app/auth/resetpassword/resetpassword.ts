import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth-service';

@Component({
  selector: 'app-resetpassword',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './resetpassword.html',
})
export class Resetpassword {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  token = this.route.snapshot.queryParams['token'] || null;

  requestForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  resetForm: FormGroup = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  });

  isSubmitting = signal(false);
  message = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  requestReset(): void {
    if (this.requestForm.invalid) return;
    this.isSubmitting.set(true);
    this.authService.forgotPassword(this.requestForm.value.email).subscribe({
      next: (res: any) => {
        this.isSubmitting.set(false);
        this.message.set(res.message);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.errorMessage.set('Une erreur est survenue.');
      },
    });
  }

  confirmReset(): void {
    if (this.resetForm.invalid) return;
    const { password, confirmPassword } = this.resetForm.value;
    if (password !== confirmPassword) {
      this.errorMessage.set('Les mots de passe ne correspondent pas.');
      return;
    }
    this.isSubmitting.set(true);
    this.authService.resetPassword(this.token, password).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Lien invalide ou expiré.');
      },
    });
  }
}