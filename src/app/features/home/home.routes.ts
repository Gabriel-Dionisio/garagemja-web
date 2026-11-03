import { Routes } from '@angular/router';

export const HOME_ROUTES: Routes = [
  {
    path: '',
    title: 'routes.home',
    loadComponent: () => import('./pages/home-page/home-page').then((m) => m.HomePage),
  },
];
