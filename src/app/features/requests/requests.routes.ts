import { Routes } from '@angular/router';

export const REQUESTS_ROUTES: Routes = [
  {
    path: '',
    title: 'routes.requests',
    loadComponent: () => import('./pages/requests-page/requests-page').then((m) => m.RequestsPage),
  },
];
