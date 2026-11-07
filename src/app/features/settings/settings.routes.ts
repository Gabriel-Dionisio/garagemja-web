import { Routes } from '@angular/router';

export const SETTINGS_ROUTES: Routes = [
  {
    path: '',
    title: 'routes.settings',
    loadComponent: () =>
      import('./pages/settings-page/settings-page').then((m) => m.SettingsPage),
  },
];
