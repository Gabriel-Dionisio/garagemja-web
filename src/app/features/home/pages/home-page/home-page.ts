import { TranslocoPipe } from '@jsverse/transloco';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { EMPTY, catchError, finalize, switchMap } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth-service';
import { ErrorText } from '../../../../core/i18n/error-text';
import { todayIso } from '../../../../shared/forms/date-format';
import { Page } from '../../../../shared/models/page';
import { Alert } from '../../../../shared/ui/alert/alert';
import { Button } from '../../../../shared/ui/button/button';
import { DateField } from '../../../../shared/ui/date-field/date-field';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { Skeleton } from '../../../../shared/ui/skeleton/skeleton';
import { TextField } from '../../../../shared/ui/text-field/text-field';
import { ParkingSpotsApi } from '../../../../shared/spots/parking-spots-api';
import { ParkingSpot } from '../../../../shared/spots/parking-spot.model';
import { SpotResults } from '../../../../shared/spots/spot-results/spot-results';
import { DEFAULT_CRITERIA, criteriaToParams } from '../../../../shared/spots/spot-search.model';
import { HomeApi } from '../../data/home-api';

@Component({
  selector: 'app-home-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslocoPipe,
    Alert,
    Button,
    DateField,
    EmptyState,
    Skeleton,
    TextField,
    SpotResults,
  ],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  private readonly api = inject(HomeApi);
  private readonly spots = inject(ParkingSpotsApi);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly today = todayIso();
  protected readonly form = inject(NonNullableFormBuilder).group({ search: [''] });
  protected readonly from = signal('');
  protected readonly to = signal('');
  protected readonly hasResidency = signal(true);
  protected readonly loading = signal(true);
  protected readonly loadFailed = signal(false);
  protected readonly page = signal(0);
  protected readonly pageSize = signal(12);
  protected readonly result = signal<Page<ParkingSpot> | null>(null);
  protected readonly spotsLoading = signal(false);
  protected readonly spotsError = inject(ErrorText).state();

  constructor() {
    this.api
      .residencyCount()
      .pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe({
        next: (residencies) => {
          this.hasResidency.set(residencies > 0);
          if (residencies === 0 && !this.auth.hasRole('CONDOMINIUM_ADMIN')) {
            void this.router.navigate(['/condominiums'], { replaceUrl: true });
          }
          this.loading.set(false);
        },
        error: () => {
          this.loadFailed.set(true);
          this.loading.set(false);
        },
      });

    toObservable(computed(() => ({ page: this.page(), size: this.pageSize() })))
      .pipe(
        switchMap(({ page, size }) => {
          this.spotsLoading.set(true);
          this.spotsError.clear();
          return this.spots.search(DEFAULT_CRITERIA, page, size).pipe(
            catchError((error: unknown) => {
              this.spotsError.setFrom(error);
              return EMPTY;
            }),
            finalize(() => this.spotsLoading.set(false)),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((result) => this.result.set(result));
  }

  protected setFrom(value: string): void {
    this.from.set(value);
    if (this.to() && this.to() < value) this.to.set(value);
  }

  protected search(): void {
    const from = this.from();
    void this.router.navigate(['/search'], {
      queryParams: criteriaToParams({
        ...DEFAULT_CRITERIA,
        search: this.form.controls.search.value.trim(),
        from,
        to: from ? this.to() || from : '',
      }),
    });
  }

  protected changeSize(size: number): void {
    this.pageSize.set(size);
    this.page.set(0);
  }

  protected goTo(page: number): void {
    this.page.set(page);
  }
}
