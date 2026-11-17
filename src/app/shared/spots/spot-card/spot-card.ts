import { TranslocoPipe } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LocaleService } from '../../../core/i18n/locale-service';
import { moneyFormatter } from '../../forms/format';
import { RatingSummary } from '../../reviews/review.model';
import { Rating } from '../../ui/rating/rating';
import { ParkingSpot, SPOT_PLACEHOLDER } from '../parking-spot.model';
import { SpotFeatures } from '../spot-features/spot-features';

@Component({
  selector: 'app-spot-card',
  imports: [TranslocoPipe, RouterLink, Rating, SpotFeatures],
  templateUrl: './spot-card.html',
  styleUrl: './spot-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpotCard {
  private readonly locale = inject(LocaleService);

  readonly spot = input.required<ParkingSpot>();
  readonly rating = input<RatingSummary | null>(null);
  readonly queryParams = input<Record<string, string | null>>({});

  protected readonly placeholder = SPOT_PLACEHOLDER;
  protected readonly money = computed(() => moneyFormatter(this.locale.language()));
}
