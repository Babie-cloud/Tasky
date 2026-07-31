import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { authInterceptor } from './core/interceptors/auth-interceptors';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes), 
    provideHttpClient(withInterceptors([authInterceptor])),
    provideClientHydration()
  ]
};