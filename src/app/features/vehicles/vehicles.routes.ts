import { Routes } from '@angular/router';

export const VEHICLES_ROUTES: Routes = [
  {
    path: '',
    title: 'routes.myVehicles',
    loadComponent: () => import('./pages/vehicles-page/vehicles-page').then((m) => m.VehiclesPage),
  },
  {
    path: 'new',
    title: 'routes.vehicleNew',
    loadComponent: () =>
      import('./pages/vehicle-form-page/vehicle-form-page').then((m) => m.VehicleFormPage),
  },
  {
    path: ':id',
    title: 'routes.vehicleEdit',
    loadComponent: () =>
      import('./pages/vehicle-form-page/vehicle-form-page').then((m) => m.VehicleFormPage),
  },
];
