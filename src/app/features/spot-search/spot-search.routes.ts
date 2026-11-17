import { Routes } from '@angular/router';

export const SPOT_SEARCH_ROUTES: Routes = [
  {
    path: '',
    title: 'routes.spotSearch',
    loadComponent: () =>
      import('./pages/spot-search-page/spot-search-page').then((m) => m.SpotSearchPage),
  },
  {
    path: ':spotId',
    title: 'routes.spotDetails',
    loadComponent: () =>
      import('./pages/spot-details-page/spot-details-page').then((m) => m.SpotDetailsPage),
  },
];
