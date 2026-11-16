import { TranslocoPipe } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LocaleService } from '../../../core/i18n/locale-service';
import { moneyFormatter } from '../../forms/format';
import { Icon } from '../../ui/icon/icon';
import { PARKING_SPOT_SIZE_LABELS } from '../parking-spot-status';
import { ParkingSpot } from '../parking-spot.model';

@Component({
  selector: 'app-spot-card',
  imports: [TranslocoPipe, RouterLink, Icon],
  templateUrl: './spot-card.html',
  styleUrl: './spot-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpotCard {
  private readonly locale = inject(LocaleService);

  readonly spot = input.required<ParkingSpot>();
  readonly queryParams = input<Record<string, string | null>>({});

  protected readonly sizeLabels = PARKING_SPOT_SIZE_LABELS;
  protected readonly money = computed(() => moneyFormatter(this.locale.language()));
}
