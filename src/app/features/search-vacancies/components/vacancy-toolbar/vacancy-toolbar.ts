import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { hasActiveFilters } from '../../search-vacancies.filters';
import {
  AvailabilityFilter,
  SizeFilter,
  VacancyCriteria,
  VacancySort,
} from '../../search-vacancies.model';
import { FilterOption, FilterSelect } from '../filter-select/filter-select';

const AVAILABILITY_OPTIONS: readonly FilterOption<AvailabilityFilter>[] = [
  { value: 'ALL', labelKey: 'searchVacancies.filters.availability.ALL' },
  { value: 'AVAILABLE', labelKey: 'searchVacancies.filters.availability.AVAILABLE' },
  { value: 'UNAVAILABLE', labelKey: 'searchVacancies.filters.availability.UNAVAILABLE' },
];

const SIZE_OPTIONS: readonly FilterOption<SizeFilter>[] = [
  { value: 'ALL', labelKey: 'searchVacancies.filters.size.ALL' },
  { value: 'SMALL', labelKey: 'searchVacancies.filters.size.SMALL' },
  { value: 'MEDIUM', labelKey: 'searchVacancies.filters.size.MEDIUM' },
  { value: 'LARGE', labelKey: 'searchVacancies.filters.size.LARGE' },
];

const SORT_OPTIONS: readonly FilterOption<VacancySort>[] = [
  { value: 'PRICE_ASC', labelKey: 'searchVacancies.sort.PRICE_ASC' },
  { value: 'PRICE_DESC', labelKey: 'searchVacancies.sort.PRICE_DESC' },
];

/** Quantidade de resultados, ordenação e filtros acima da listagem. */
@Component({
  selector: 'app-vacancy-toolbar',
  imports: [TranslocoPipe, FilterSelect],
  templateUrl: './vacancy-toolbar.html',
  styleUrl: './vacancy-toolbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VacancyToolbar {
  readonly count = input.required<number>();
  readonly criteria = model.required<VacancyCriteria>();
  readonly cleared = output<void>();

  protected readonly availabilityOptions = AVAILABILITY_OPTIONS;
  protected readonly sizeOptions = SIZE_OPTIONS;
  protected readonly sortOptions = SORT_OPTIONS;
  protected readonly hasFilters = computed(() => hasActiveFilters(this.criteria()));

  protected patch(changes: Partial<VacancyCriteria>): void {
    this.criteria.update((current) => ({ ...current, ...changes }));
  }
}
