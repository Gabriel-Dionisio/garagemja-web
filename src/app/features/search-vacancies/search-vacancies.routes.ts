import { Routes } from '@angular/router';

export const SEARCH_VACANCIES_ROUTES: Routes = [
  {
    path: '',
    title: 'routes.searchVacancies',
    data: { topbarSearch: true },
    loadComponent: () =>
      import('./pages/search-vacancies-page/search-vacancies-page').then(
        (m) => m.SearchVacanciesPage,
      ),
  },
];
