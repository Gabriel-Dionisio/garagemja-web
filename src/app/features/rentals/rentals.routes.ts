import { Routes } from '@angular/router';

export const RENTALS_ROUTES: Routes = [
  {
    path: '',
    title: 'routes.myRentals',
    loadComponent: () =>
      import('./pages/my-rentals-page/my-rentals-page').then((m) => m.MyRentalsPage),
  },
];
