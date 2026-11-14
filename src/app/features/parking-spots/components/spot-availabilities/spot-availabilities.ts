import { TranslocoPipe } from '@jsverse/transloco';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Dialog } from '@angular/cdk/dialog';
import { EMPTY, Observable, catchError, finalize, forkJoin, switchMap } from 'rxjs';
import { ErrorText } from '../../../../core/i18n/error-text';
import { LocaleService } from '../../../../core/i18n/locale-service';
import { Alert } from '../../../../shared/ui/alert/alert';
import { Badge } from '../../../../shared/ui/badge/badge';
import { Button } from '../../../../shared/ui/button/button';
import { Card } from '../../../../shared/ui/card/card';
import { ConfirmService } from '../../../../shared/ui/confirm-dialog/confirm-service';
import { Icon } from '../../../../shared/ui/icon/icon';
import { IconButton } from '../../../../shared/ui/icon-button/icon-button';
import { ScrollArea } from '../../../../shared/ui/scroll-area/scroll-area';
import { ListItem } from '../../../../shared/ui/list-item/list-item';
import { Switch } from '../../../../shared/ui/switch/switch';
import {
  AvailabilityDialog,
  AvailabilityDialogData,
} from '../availability-dialog/availability-dialog';
import { ParkingSpotsApi } from '../../data/parking-spots-api';
import { dateFormatter, moneyFormatter } from '../../../../shared/forms/format';
import { aboveCap } from '../../parking-spot-status';
import { SpotAvailability, SpotAvailabilityInput, SpotRules } from '../../parking-spot.model';

const NO_RULES: SpotRules = {
  maxPricePerDay: null,
  maxPricePerHour: null,
  hourlyRentalsEnabled: false,
};

@Component({
  selector: 'app-spot-availabilities',
  imports: [
    TranslocoPipe,
    Alert,
    Badge,
    Button,
    Card,
    Icon,
    IconButton,
    ListItem,
    ScrollArea,
    Switch,
  ],
  templateUrl: './spot-availabilities.html',
  styleUrl: './spot-availabilities.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpotAvailabilities {
  private readonly api = inject(ParkingSpotsApi);
  private readonly confirm = inject(ConfirmService);
  private readonly dialog = inject(Dialog);
  private readonly locale = inject(LocaleService);
  private readonly destroyRef = inject(DestroyRef);

  readonly spotId = input.required<string>();
  readonly condominiumId = input.required<string>();
  readonly editable = input(true);

  protected readonly aboveCap = aboveCap;
  protected readonly money = computed(() => moneyFormatter(this.locale.language()));
  protected readonly date = computed(() => dateFormatter(this.locale.language()));

  protected readonly rules = signal<SpotRules>(NO_RULES);
  protected readonly availabilities = signal<SpotAvailability[]>([]);
  protected readonly loaded = signal(false);
  protected readonly busy = signal(false);
  protected readonly error = inject(ErrorText).state({
    403: 'errors.parkingSpots.forbidden',
    404: 'errors.parkingSpots.notFound',
    409: 'errors.parkingSpots.conflict',
  });

  constructor() {
    toObservable(computed(() => ({ spotId: this.spotId(), condominiumId: this.condominiumId() })))
      .pipe(
        switchMap(({ spotId, condominiumId }) => {
          this.error.clear();
          return forkJoin({
            rules: this.api.rules(condominiumId),
            availabilities: this.api.availabilities(spotId),
          }).pipe(
            catchError((error: unknown) => {
              this.error.setFrom(error);
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe(({ rules, availabilities }) => {
        this.rules.set(rules);
        this.loaded.set(true);
        this.availabilities.set(availabilities);
      });
  }

  protected openDialog(availability: SpotAvailability | null): void {
    if (this.busy() || !this.loaded()) return;
    const data: AvailabilityDialogData = { rules: this.rules(), availability };
    this.dialog
      .open<SpotAvailabilityInput, AvailabilityDialogData>(AvailabilityDialog, {
        data,
        ariaLabelledBy: 'availability-title',
      })
      .closed.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((input) => {
        if (input) this.save(availability, input);
      });
  }

  private save(availability: SpotAvailability | null, input: SpotAvailabilityInput): void {
    const call: Observable<unknown> = availability
      ? this.api.updateAvailability(availability.id, {
          ...input,
          ...(input.hourlyPrice === null ? { clearHourlyPrice: true } : {}),
          ...(input.dailyPrice === null ? { clearDailyPrice: true } : {}),
        })
      : this.api.createAvailability(this.spotId(), input);
    this.run(call, () => undefined);
  }

  protected toggle(availability: SpotAvailability, active: boolean): void {
    this.run(this.api.updateAvailability(availability.id, { active }), () => undefined);
  }

  protected remove(availability: SpotAvailability): void {
    this.confirm
      .confirm({
        title: 'parkingSpots.availability.confirmRemove.title',
        message: 'parkingSpots.availability.confirmRemove.message',
        confirmLabel: 'parkingSpots.availability.confirmRemove.confirm',
        params: {},
        danger: true,
      })
      .pipe(
        switchMap((confirmed) =>
          confirmed ? this.api.removeAvailability(availability.id) : EMPTY,
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.reload(),
        error: (error: unknown) => this.error.setFrom(error),
      });
  }

  private run(call: Observable<unknown>, onDone: () => void): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.clear();
    call
      .pipe(
        finalize(() => this.busy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          onDone();
          this.reload();
        },
        error: (error: unknown) => this.error.setFrom(error),
      });
  }

  private reload(): void {
    this.api
      .availabilities(this.spotId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => this.availabilities.set(items),
        error: (error: unknown) => this.error.setFrom(error),
      });
  }
}
