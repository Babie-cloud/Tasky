import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth-service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule ],
  templateUrl: './signup.html',
  styleUrls: ['./signup.scss']
})
export class Signup {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  signupForm: FormGroup;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor() {
    this.signupForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    console.log('Form submitted! Valid:', this.signupForm.valid); 
    console.log('Form values:', this.signupForm.value);

    if (this.signupForm.valid) {
      const { username, email, password } = this.signupForm.value;
      console.log('Sending request to backend...'); 
      this.authService.register(username, email, password).subscribe({
        next: (res) => {
          console.log('Success response:', res); 
          this.successMessage = 'Inscription réussie ! Redirection vers le login...';
          this.errorMessage = null;
          setTimeout(() => this.router.navigate(['login']), 2000);
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error response:', err); 
          this.errorMessage = err.error?.error || 'Erreur lors de l\'inscription.';
          this.successMessage = null;
        },
        complete: () => console.log('Request complete') 
      });
    } else {
      console.log('Form invalid, not sending request'); 
    }
  }

  OpenLogin(): void {
    this.router.navigate(['/login']);
  }
}