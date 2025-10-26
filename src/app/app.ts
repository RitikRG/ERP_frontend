import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, RouterOutlet  } from '@angular/router';
import { routes } from './app.routes';
import { AuthInterceptor } from './auth/auth.interceptor';
import { CommonModule } from '@angular/common';
import { ToastComponent } from './services/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ToastComponent],
  templateUrl: './app.html',
})
export class App {}

bootstrapApplication(App, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([AuthInterceptor])),
  ],
});
