import { Routes } from '@angular/router';

export const PARKING_SPOT_ROUTES: Routes = [
  {
    path: '',
    title: 'routes.parkingSpots',
    loadComponent: () =>
      import('./pages/parking-spots-page/parking-spots-page').then((m) => m.ParkingSpotsPage),
  },
  {
    path: 'new',
    title: 'routes.parkingSpotNew',
    loadComponent: () =>
      import('./pages/parking-spot-form-page/parking-spot-form-page').then(
        (m) => m.ParkingSpotFormPage,
      ),
  },
  {
    path: ':spotId',
    title: 'routes.parkingSpotEdit',
    loadComponent: () =>
      import('./pages/parking-spot-form-page/parking-spot-form-page').then(
        (m) => m.ParkingSpotFormPage,
      ),
  },
];

export const MY_PARKING_SPOT_ROUTES: Routes = [
  {
    path: '',
    title: 'routes.myParkingSpots',
    loadComponent: () =>
      import('./pages/my-parking-spots-page/my-parking-spots-page').then(
        (m) => m.MyParkingSpotsPage,
      ),
  },
  {
    path: 'new',
    title: 'routes.parkingSpotNew',
    loadComponent: () =>
      import('./pages/parking-spot-form-page/parking-spot-form-page').then(
        (m) => m.ParkingSpotFormPage,
      ),
  },
  {
    path: ':spotId',
    title: 'routes.parkingSpotEdit',
    loadComponent: () =>
      import('./pages/parking-spot-form-page/parking-spot-form-page').then(
        (m) => m.ParkingSpotFormPage,
      ),
  },
];
