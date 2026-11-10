import { ChangeDetectionStrategy, Component, OnDestroy, inject, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { TopbarSearch } from '../../../../core/layout/topbar-search';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { IllustrativeMap } from '../../components/illustrative-map/illustrative-map';
import { VacancyCard } from '../../components/vacancy-card/vacancy-card';
import { Vacancy } from '../../search-vacancies.model';

@Component({
  selector: 'app-search-vacancies-page',
  imports: [TranslocoPipe, EmptyState, IllustrativeMap, VacancyCard],
  templateUrl: './search-vacancies-page.html',
  styleUrl: './search-vacancies-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchVacanciesPage implements OnDestroy {
  private readonly topbarSearch = inject(TopbarSearch);

  /**
   * Resultados exibidos. Permanece vazio até o backend oferecer busca paginada
   * (paginação, ordenação, filtros e campos de vaga): não há fonte de dados real ainda.
   */
  protected readonly vacancies = signal<Vacancy[]>([]);

  ngOnDestroy(): void {
    this.topbarSearch.term.set('');
  }
}
