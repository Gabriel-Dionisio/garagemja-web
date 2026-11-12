import { inject } from '@angular/core';
import { homeGuard } from './core/auth/home-guard';
import { roleGuard } from './core/auth/role-guard';
import { Router, Routes } from '@angular/router';
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
        canActivate: [homeGuard],
        loadChildren: () => import('./features/home/home.routes').then((m) => m.HOME_ROUTES),
      },
      {
        path: 'rentals',
        loadChildren: () =>
          import('./features/rentals/rentals.routes').then((m) => m.RENTALS_ROUTES),
      },
      {
        path: 'condominiums/:id/history',
        title: 'routes.history',
        canActivate: [roleGuard('ADMIN', 'CONDOMINIUM_ADMIN')],
        loadComponent: () =>
          import('./features/audit/pages/audit-logs-page/audit-logs-page').then(
            (m) => m.AuditLogsPage,
          ),
      },
      {
        path: 'admin/audit-logs',
        title: 'routes.auditLogs',
        canActivate: [roleGuard('ADMIN')],
        loadComponent: () =>
          import('./features/audit/pages/audit-logs-page/audit-logs-page').then(
            (m) => m.AuditLogsPage,
          ),
      },
      {
        path: 'condominiums',
        loadChildren: () =>
          import('./features/condominiums/condominiums.routes').then((m) => m.CONDOMINIUM_ROUTES),
      },
      {
        path: 'dashboard',
        title: 'routes.dashboard',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard-page/dashboard-page').then(
            (m) => m.DashboardPage,
          ),
      },
      { path: 'join', pathMatch: 'full', redirectTo: 'condominiums' },
      {
        path: 'join/:code',
        redirectTo: ({ params }) =>
          inject(Router).createUrlTree(['/condominiums'], {
            queryParams: { code: params['code'] },
          }),
      },
      {
        path: 'admin',
        loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
      },
      {
        path: 'settings',
        loadChildren: () => import('./features/settings/settings.routes').then((m) => m.SETTINGS_ROUTES),
      },
      {
        path: 'profile',
        loadChildren: () => import('./features/profile/profile.routes').then((m) => m.PROFILE_ROUTES),
      },
    ],
  },
  { path: '**', redirectTo: 'home' },
];
