import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth-guard';
import { guestGuard } from './core/auth/guest-guard';
import { AuthLayout } from './core/layout/auth-layout/auth-layout';
import { ShellLayout } from './core/layout/shell-layout/shell-layout';

export const routes: Routes = [
  {
    path: 'status',
    loadChildren: () => import('./features/status/status.routes').then((m) => m.STATUS_ROUTES),
  },
  {
    path: 'confirm-email',
    component: AuthLayout,
    children: [
      {
        path: '',
        title: 'routes.confirmEmail',
        loadComponent: () =>
          import('./features/auth/pages/confirm-email-page/confirm-email-page').then(
            (m) => m.ConfirmEmailPage,
          ),
      },
    ],
  },
  {
    path: 'reset-password',
    component: AuthLayout,
    children: [
      {
        path: '',
        title: 'routes.resetPassword',
        loadComponent: () =>
          import('./features/auth/pages/reset-password-page/reset-password-page').then(
            (m) => m.ResetPasswordPage,
          ),
      },
    ],
  },
  {
    path: '',
    component: AuthLayout,
    canActivate: [guestGuard],
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: '',
    component: ShellLayout,
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        loadChildren: () => import('./features/home/home.routes').then((m) => m.HOME_ROUTES),
      },
      {
        path: 'rentals',
        loadChildren: () =>
          import('./features/rentals/rentals.routes').then((m) => m.RENTALS_ROUTES),
      },
      {
        path: 'admin',
        loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
      },
    ],
  },
  { path: '**', redirectTo: 'home' },
];
