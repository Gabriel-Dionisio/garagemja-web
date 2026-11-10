import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-search-vacancies-page',
  imports: [TranslocoPipe],
  templateUrl: './search-vacancies-page.html',
  styleUrl: './search-vacancies-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchVacanciesPage {}
