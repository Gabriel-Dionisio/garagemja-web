import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/role-guard';

export const ADMIN_ROUTES: Routes = [
  { path: 'dashboard', redirectTo: '/dashboard' },
  {
    path: 'users',
    canActivate: [roleGuard('ADMIN')],
    children: [
      {
        path: '',
        title: 'routes.adminUsers',
        loadComponent: () => import('./pages/users-page/users-page').then((m) => m.UsersPage),
      },
      {
        path: 'new',
        title: 'routes.adminUserNew',
        loadComponent: () =>
          import('./pages/user-form-page/user-form-page').then((m) => m.UserFormPage),
      },
      {
        path: ':id',
        title: 'routes.adminUserDetail',
        loadComponent: () =>
          import('./pages/user-detail-page/user-detail-page').then((m) => m.UserDetailPage),
      },
    ],
  },
];
