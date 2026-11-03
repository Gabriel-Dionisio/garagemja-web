import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    title: 'routes.login',
    data: { brand: 'full' },
    loadComponent: () => import('./pages/login-page/login-page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    title: 'routes.register',
    loadComponent: () => import('./pages/register-page/register-page').then((m) => m.RegisterPage),
  },
  {
    path: 'forgot-password',
    title: 'routes.forgotPassword',
    loadComponent: () =>
      import('./pages/forgot-password-page/forgot-password-page').then((m) => m.ForgotPasswordPage),
  },
  {
    path: 'verify-email',
    title: 'routes.verifyEmail',
    loadComponent: () =>
      import('./pages/verify-email-page/verify-email-page').then((m) => m.VerifyEmailPage),
  },
];
