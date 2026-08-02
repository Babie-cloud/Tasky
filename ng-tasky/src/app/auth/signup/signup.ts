import { Component, inject, signal, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth-service';
import { environment } from '../../../environments/environment';

declare const google: any;
declare const FB: any;

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-signup',
  imports: [RouterLink, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './signup.html',
  styleUrl: './signup.scss',
})
export class Signup implements AfterViewInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  @ViewChild('googleBtn') googleBtn!: ElementRef;

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

  ngAfterViewInit(): void {
    if (typeof google !== 'undefined') {
      google.accounts.id.initialize({
        client_id: environment.googleClientId,
        callback: (response: any) => this.handleGoogleResponse(response),
      });
      google.accounts.id.renderButton(this.googleBtn.nativeElement, {
        theme: 'outline',
        size: 'large',
        width: '100%',
      });
    }

    if (typeof FB !== 'undefined') {
      FB.init({ appId: environment.facebookAppId, version: 'v19.0', xfbml: false });
    }
  }

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
          this.router.navigate(['/homepage']);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(
            err.status === 409
              ? 'An account already exists with this email.'
              : 'Something went wrong. Please try again.'
          );
        },
      });
  }

  handleGoogleResponse(response: any): void {
    this.authService.loginWithGoogle(response.credential).subscribe({
      next: (res: any) => {
        localStorage.setItem('token', res.token);
        this.router.navigateByUrl('/homepage');
      },
      error: () => this.errorMessage.set('Google authentication failed.'),
    });
  }

  loginWithFacebook(): void {
    FB.login((response: any) => {
      if (response.authResponse) {
        const { accessToken, userID } = response.authResponse;
        this.authService.loginWithFacebook(accessToken, userID).subscribe({
          next: (res: any) => {
            localStorage.setItem('token', res.token);
            this.router.navigateByUrl('/homepage');
          },
          error: () => this.errorMessage.set('Facebook authentication failed.'),
        });
      }
    }, { scope: 'email' });
  }
}