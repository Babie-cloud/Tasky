import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth-service';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-signup',
  imports: [RouterLink, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './signup.html',
})
export class Signup {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  SignupForm: FormGroup = this.fb.group(
    {
      name: ['', Validators.required],
      prenom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordMatchValidator }
  );

  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  onSubmit(): void {
    if (this.SignupForm.invalid || this.isSubmitting()) {
      this.SignupForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const { name, prenom, email, password, confirmPassword } = this.SignupForm.value;

    this.authService
      .signup({
        first_name: prenom,
        last_name: name,
        email,
        password,
        confirm_password: confirmPassword,
      })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.router.navigate(['/userdashboard']);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          console.error('[Signup] Erreur d\'inscription', err);
          this.errorMessage.set(
            err.status === 409
              ? 'An account already exists with this email.'
              : 'Something went wrong. Please try again.'
          );
        },
      });
  }
}