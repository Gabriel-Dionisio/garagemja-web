import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LocaleService } from '../../../../core/i18n/locale-service';
import { RentalCard, RentalStatus } from '../../rental.model';

const STATUS_LABELS: Record<RentalStatus, string> = {
  PENDING: 'rentals.status.PENDING',
  APPROVED: 'rentals.status.APPROVED',
  ACTIVE: 'rentals.status.ACTIVE',
  REFUSED: 'rentals.status.REFUSED',
  CANCELED: 'rentals.status.CANCELED',
  FINISHED: 'rentals.status.FINISHED',
};

@Component({
  selector: 'app-rental-item-card',
  imports: [TranslocoPipe],
  templateUrl: './rental-item-card.html',
  styleUrl: './rental-item-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RentalItemCard {
  private readonly locale = inject(LocaleService);

  readonly rental = input.required<RentalCard>();
  protected readonly statusLabels = STATUS_LABELS;
  protected readonly fallbackImage = '/images/parking-spot-placeholder.png';

  protected formatDate(value: string): string {
    const [year, month, day] = value.split('-').map(Number);
    return new Intl.DateTimeFormat(this.locale.language()).format(new Date(year, month - 1, day));
  }

  protected formatPrice(value: number): string {
    return new Intl.NumberFormat(this.locale.language(), {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  protected useFallbackImage(event: Event): void {
    const image = event.currentTarget;
    if (image instanceof HTMLImageElement && image.getAttribute('src') !== this.fallbackImage) {
      image.src = this.fallbackImage;
    }
  }
}
