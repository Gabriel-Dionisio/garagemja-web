import { Dialog } from '@angular/cdk/dialog';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, filter, forkJoin, map, of, switchMap } from 'rxjs';
import { ErrorText } from '../../../../core/i18n/error-text';
import { LocaleService } from '../../../../core/i18n/locale-service';
import { todayIso } from '../../../../shared/forms/date-format';
import { dateFormatter, moneyFormatter } from '../../../../shared/forms/format';
import { Alert } from '../../../../shared/ui/alert/alert';
import { Avatar } from '../../../../shared/ui/avatar/avatar';
import { Button } from '../../../../shared/ui/button/button';
import { Card } from '../../../../shared/ui/card/card';
import { Page } from '../../../../shared/ui/page/page';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { Skeleton } from '../../../../shared/ui/skeleton/skeleton';
import { ParkingSpotsApi } from '../../../../shared/spots/parking-spots-api';
import { PARKING_SPOT_SIZE_LABELS } from '../../../../shared/spots/parking-spot-status';
import {
  ParkingSpot,
  ParkingSpotImage,
  SpotAvailability,
  SpotRules,
} from '../../../../shared/spots/parking-spot.model';
import { VehiclesApi } from '../../../../shared/vehicles/vehicles-api';
import {
  RequestRentalDialog,
  RequestRentalDialogData,
} from '../../components/request-rental-dialog/request-rental-dialog';

interface SpotDetails {
  spot: ParkingSpot;
  images: ParkingSpotImage[];
  availabilities: SpotAvailability[];
  rules: SpotRules;
  owned: boolean;
}

@Component({
  selector: 'app-spot-details-page',
  imports: [TranslocoPipe, RouterLink, Alert, Avatar, Button, Card, Page, PageHeader, Skeleton],
  templateUrl: './spot-details-page.html',
  styleUrl: './spot-details-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpotDetailsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly spots = inject(ParkingSpotsApi);
  private readonly vehicles = inject(VehiclesApi);
  private readonly dialog = inject(Dialog);
  private readonly locale = inject(LocaleService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly error = inject(ErrorText).state({ 404: 'errors.parkingSpots.notFound' });
  protected readonly sizeLabels = PARKING_SPOT_SIZE_LABELS;
  protected readonly money = computed(() => moneyFormatter(this.locale.language()));
  protected readonly date = computed(() => dateFormatter(this.locale.language()));
  protected readonly selectedImage = signal(0);
  protected readonly details = signal<SpotDetails | null>(null);
  protected readonly loading = signal(true);
  protected readonly images = computed(() => this.details()?.images ?? []);

  constructor() {
    const spotId = this.route.snapshot.paramMap.get('spotId') ?? '';
    forkJoin({
      spot: this.spots.get(spotId),
      images: this.spots.images(spotId).pipe(catchError(() => of([]))),
      availabilities: this.spots.availabilities(spotId),
      residencies: this.vehicles.residencies(),
    })
      .pipe(
        switchMap((loaded) =>
          this.spots.rules(loaded.spot.condominiumId).pipe(
            map((rules) => ({ ...loaded, rules })),
            catchError(() => of({ ...loaded, rules: NO_HOURLY })),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe({
        next: ({ spot, images, availabilities, residencies, rules }) => {
          const today = todayIso();
          this.details.set({
            spot,
            images,
            rules,
            availabilities: availabilities.filter((item) => item.active && item.endDate >= today),
            owned: residencies.some((residency) => residency.id === spot.ownerResidentId),
          });
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.error.setFrom(error);
          this.loading.set(false);
        },
      });
  }

  protected request(details: SpotDetails): void {
    const query = this.route.snapshot.queryParamMap;
    const data: RequestRentalDialogData = {
      spot: details.spot,
      availabilities: details.availabilities,
      rules: details.rules,
      from: query.get('from') ?? '',
      to: query.get('to') ?? '',
    };
    this.dialog
      .open<boolean>(RequestRentalDialog, { data, ariaLabelledBy: 'request-rental-title' })
      .closed.pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => void this.router.navigate(['/rentals']));
  }
}

const NO_HOURLY: SpotRules = {
  maxPricePerDay: null,
  maxPricePerHour: null,
  hourlyRentalsEnabled: false,
};
