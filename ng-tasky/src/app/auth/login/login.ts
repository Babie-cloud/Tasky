import { Component, inject, signal, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth-service';
import { environment } from '../../../environments/environment';

declare const google: any;
declare const FB: any;

@Component({
  selector: 'app-login',
  imports: [RouterLink, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './login.html',
})
export class Login implements AfterViewInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  @ViewChild('googleBtn') googleBtn!: ElementRef;

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  ngAfterViewInit(): void {
    // Google
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

    // Facebook
    if (typeof FB !== 'undefined') {
      FB.init({ appId: environment.facebookAppId, version: 'v19.0', xfbml: false });
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid || this.isSubmitting()) {
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
        this.errorMessage.set(
          err.status === 401 ? 'Incorrect email or password.' : 'Something went wrong. Please try again.'
        );
      },
    });
  }

  handleGoogleResponse(response: any): void {
    this.authService.loginWithGoogle(response.credential).subscribe({
      next: (res: any) => {
        localStorage.setItem('token', res.token);
        this.router.navigateByUrl('/dashboard-user');
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
            this.router.navigateByUrl('/dashboard-user');
          },
          error: () => this.errorMessage.set('Facebook authentication failed.'),
        });
      }
    }, { scope: 'email' });
  }
}