import { Routes } from '@angular/router';

export const SEARCH_VACANCIES_ROUTES: Routes = [
  {
    path: '',
    title: 'routes.searchVacancies',
    loadComponent: () =>
      import('./pages/search-vacancies-page/search-vacancies-page').then(
        (m) => m.SearchVacanciesPage,
      ),
  },
  {
    path: ':spotId',
    title: 'routes.vacancyDetails',
    loadComponent: () =>
      import('./pages/vacancy-details-page/vacancy-details-page').then((m) => m.VacancyDetailsPage),
  },
];
