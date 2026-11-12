import { Routes } from '@angular/router';

export const SETTINGS_ROUTES: Routes = [
  {
    path: '',
    title: 'routes.settings',
    data: { showTopbar: false },
    loadComponent: () => import('./pages/settings-page/settings-page').then((m) => m.SettingsPage),
  },
];
