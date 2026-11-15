import { TranslocoPipe } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LocaleService } from '../../../../core/i18n/locale-service';
import { moneyFormatter } from '../../../../shared/forms/format';
import { Icon } from '../../../../shared/ui/icon/icon';
import { PARKING_SPOT_SIZE_LABELS } from '../../../parking-spots/parking-spot-status';
import { ParkingSpot } from '../../../parking-spots/parking-spot.model';

@Component({
  selector: 'app-vacancy-card',
  imports: [TranslocoPipe, RouterLink, Icon],
  templateUrl: './vacancy-card.html',
  styleUrl: './vacancy-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VacancyCard {
  private readonly locale = inject(LocaleService);

  readonly spot = input.required<ParkingSpot>();
  readonly queryParams = input<Record<string, string | null>>({});

  protected readonly sizeLabels = PARKING_SPOT_SIZE_LABELS;
  protected readonly money = computed(() => moneyFormatter(this.locale.language()));
}
