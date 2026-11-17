import { Routes } from '@angular/router';

export const REVIEW_REPORT_ROUTES: Routes = [
  {
    path: '',
    title: 'routes.adminReviews',
    loadComponent: () =>
      import('./pages/review-reports-page/review-reports-page').then((m) => m.ReviewReportsPage),
  },
];

export const PROFILE_ROUTES: Routes = [
  {
    path: '',
    title: 'routes.profile',
    loadComponent: () =>
      import('./pages/public-profile-page/public-profile-page').then((m) => m.PublicProfilePage),
  },
];
