import { TranslocoPipe } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Page } from '../../../../shared/models/page';
import { Alert } from '../../../../shared/ui/alert/alert';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { PAGE_SIZES, Paginator } from '../../../../shared/ui/paginator/paginator';
import { Skeleton } from '../../../../shared/ui/skeleton/skeleton';
import { ParkingSpot } from '../../../parking-spots/parking-spot.model';
import { VacancyCard } from '../vacancy-card/vacancy-card';

@Component({
  selector: 'app-vacancy-results',
  imports: [TranslocoPipe, Alert, EmptyState, Paginator, Skeleton, VacancyCard],
  templateUrl: './vacancy-results.html',
  styleUrl: './vacancy-results.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VacancyResults {
  readonly result = input.required<Page<ParkingSpot> | null>();
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly queryParams = input<Record<string, string | null>>({});
  readonly pageChange = output<number>();
  readonly sizeChange = output<number>();

  protected readonly pageSizes = PAGE_SIZES;
}
