import { Routes } from '@angular/router';

export const STATUS_ROUTES: Routes = [
  {
    path: '',
    title: 'routes.status',
    loadComponent: () => import('./pages/status-page/status-page').then((m) => m.StatusPage),
  },
];
