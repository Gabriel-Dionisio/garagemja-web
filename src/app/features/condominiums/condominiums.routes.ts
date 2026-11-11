import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/role-guard';

export const CONDOMINIUM_ROUTES: Routes = [
  {
    path: '',
    title: 'routes.condominiums',
    loadComponent: () =>
      import('./pages/condominiums-page/condominiums-page').then((m) => m.CondominiumsPage),
  },
  { path: 'managed', redirectTo: '' },
  { path: 'residing', redirectTo: '' },
  {
    path: 'new',
    canActivate: [roleGuard('RESIDENT', 'CONDOMINIUM_ADMIN')],
    title: 'routes.condominiumNew',
    loadComponent: () =>
      import('./pages/condominium-form-page/condominium-form-page').then(
        (m) => m.CondominiumFormPage,
      ),
  },
  { path: 'dashboard', redirectTo: '/dashboard' },
  {
    path: ':id/residents',
    canActivate: [roleGuard('CONDOMINIUM_ADMIN')],
    title: 'routes.condominiumResidents',
    loadComponent: () =>
      import('./pages/condominium-residents-page/condominium-residents-page').then(
        (m) => m.CondominiumResidentsPage,
      ),
  },
  {
    path: ':id/managers',
    canActivate: [roleGuard('ADMIN', 'CONDOMINIUM_ADMIN')],
    title: 'routes.condominiumManagers',
    loadComponent: () =>
      import('./pages/condominium-managers-page/condominium-managers-page').then(
        (m) => m.CondominiumManagersPage,
      ),
  },
  {
    path: ':id',
    title: 'routes.condominiumDetail',
    loadComponent: () =>
      import('./pages/condominium-form-page/condominium-form-page').then(
        (m) => m.CondominiumFormPage,
      ),
  },
];
