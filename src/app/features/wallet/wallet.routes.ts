import { Routes } from '@angular/router';

export const WALLET_ROUTES: Routes = [
  {
    path: '',
    title: 'routes.wallet',
    loadComponent: () => import('./pages/wallet-page/wallet-page').then((m) => m.WalletPage),
  },
];
