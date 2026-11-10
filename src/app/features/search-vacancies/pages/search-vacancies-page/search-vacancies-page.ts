import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { TranslocoPipe } from '@jsverse/transloco';
import { catchError, debounce, map, of, startWith, switchMap, timer } from 'rxjs';
import { TopbarSearch } from '../../../../core/layout/topbar-search';
import { Button } from '../../../../shared/ui/button/button';
import { Alert } from '../../../../shared/ui/alert/alert';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { LoadingBlock } from '../../../../shared/ui/loading-block/loading-block';
import { IllustrativeMap } from '../../components/illustrative-map/illustrative-map';
import { VacancyCard } from '../../components/vacancy-card/vacancy-card';
import { VacancyToolbar } from '../../components/vacancy-toolbar/vacancy-toolbar';
import { SearchVacanciesApi } from '../../data/search-vacancies-api';
import { filterAndSortVacancies, hasActiveFilters } from '../../search-vacancies.filters';
import { DEFAULT_CRITERIA, Vacancy, VacancyCriteria } from '../../search-vacancies.model';

type SearchState =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'ready'; vacancies: Vacancy[] };

/** Tempo de espera após a digitação antes de aplicar a pesquisa. */
const SEARCH_DEBOUNCE_MS = 300;

@Component({
  selector: 'app-search-vacancies-page',
  imports: [
    TranslocoPipe,
    Alert,
    Button,
    EmptyState,
    LoadingBlock,
    IllustrativeMap,
    VacancyCard,
    VacancyToolbar,
  ],
  templateUrl: './search-vacancies-page.html',
  styleUrl: './search-vacancies-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchVacanciesPage {
  private readonly api = inject(SearchVacanciesApi);
  private readonly topbarSearch = inject(TopbarSearch);
  private readonly reloadTrigger = signal(0);

  protected readonly criteria = signal<VacancyCriteria>(DEFAULT_CRITERIA);

  /** Pesquisa aplicada: o campo da barra superior com debounce (limpar aplica na hora). */
  private readonly query = signal('');

  /** `switchMap` descarta respostas de carregamentos antigos (ex.: ao tentar novamente). */
  protected readonly state = toSignal(
    toObservable(this.reloadTrigger).pipe(
      switchMap(() =>
        this.api.loadAll().pipe(
          map((vacancies): SearchState => ({ kind: 'ready', vacancies })),
          catchError(() => of<SearchState>({ kind: 'error' })),
          startWith<SearchState>({ kind: 'loading' }),
        ),
      ),
    ),
    { initialValue: { kind: 'loading' } as SearchState },
  );

  protected readonly allVacancies = computed(() => {
    const state = this.state();
    return state.kind === 'ready' ? state.vacancies : [];
  });

  /** Resultados atuais: pesquisa, filtros e ordenação aplicados juntos. */
  protected readonly vacancies = computed(() =>
    filterAndSortVacancies(this.allVacancies(), this.query(), this.criteria()),
  );

  protected readonly hasConstraints = computed(
    () => this.query().trim() !== '' || hasActiveFilters(this.criteria()),
  );

  constructor() {
    toObservable(this.topbarSearch.term)
      .pipe(
        debounce((term) => (term === '' ? of(0) : timer(SEARCH_DEBOUNCE_MS))),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe((term) => this.query.set(term));

    inject(DestroyRef).onDestroy(() => this.topbarSearch.term.set(''));
  }

  protected reload(): void {
    this.reloadTrigger.update((value) => value + 1);
  }

  /** Volta a "Todas"/"Tamanho" e limpa a pesquisa; a ordenação escolhida é mantida. */
  protected clearFilters(): void {
    this.criteria.update((current) => ({ ...DEFAULT_CRITERIA, sort: current.sort }));
    this.topbarSearch.term.set('');
  }
}
