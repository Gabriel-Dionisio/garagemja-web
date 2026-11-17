import { Routes } from '@angular/router';
import { REQUEST_TABS } from './request.model';

export const REQUESTS_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: REQUEST_TABS[0].path },
  ...REQUEST_TABS.map((tab) => ({
    path: tab.path,
    title: 'routes.requests',
    data: { status: tab.status },
    loadComponent: () => import('./pages/requests-page/requests-page').then((m) => m.RequestsPage),
  })),
  { path: '**', redirectTo: REQUEST_TABS[0].path },
];
