import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoPipe } from '@jsverse/transloco';
import { LocaleService } from '../../../../core/i18n/locale-service';
import { ErrorText } from '../../../../core/i18n/error-text';
import { AuthService } from '../../../../core/auth/auth-service';
import { Alert } from '../../../../shared/ui/alert/alert';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { LoadingBlock } from '../../../../shared/ui/loading-block/loading-block';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { RentalItemCard } from '../../components/rental-item-card/rental-item-card';
import { isHistoricalRental, isRentalRequest, RentalCard, RentalTab } from '../../rental.model';
import { RentalsApi } from '../../data/rentals-api';

const TABS: readonly RentalTab[] = ['active', 'requests', 'history'];

@Component({
  selector: 'app-my-rentals-page',
  imports: [TranslocoPipe, Alert, EmptyState, LoadingBlock, PageHeader, RentalItemCard],
  templateUrl: './my-rentals-page.html',
  styleUrl: './my-rentals-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyRentalsPage {
  private readonly api = inject(RentalsApi);
  private readonly auth = inject(AuthService);
  private readonly errorText = inject(ErrorText);

  protected readonly tabs = TABS;
  protected readonly selectedTab = signal<RentalTab>('active');
  protected readonly rentals = signal<RentalCard[] | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = this.errorText.state();
  protected readonly activeRentals = computed(() =>
    (this.rentals() ?? []).filter((rental) => rental.status === 'ACTIVE'),
  );
  protected readonly requests = computed(() =>
    (this.rentals() ?? []).filter((rental) => isRentalRequest(rental.status)),
  );
  protected readonly history = computed(() =>
    (this.rentals() ?? []).filter((rental) => isHistoricalRental(rental.status)),
  );

  constructor() {
    const userId = this.auth.user()?.id;
    if (!userId) {
      this.error.setFrom(new Error('Authenticated user is required'));
      return;
    }

    this.loading.set(true);
    this.api
      .loadForUser(userId)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (rentals) => {
          this.rentals.set(rentals);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.error.setFrom(error);
          this.loading.set(false);
        },
      });
  }

  protected selectTab(tab: RentalTab): void {
    this.selectedTab.set(tab);
  }
}
