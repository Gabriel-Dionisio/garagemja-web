import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LocaleService } from '../../../core/i18n/locale-service';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-rating',
  imports: [TranslocoPipe, Icon],
  templateUrl: './rating.html',
  styleUrl: './rating.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Rating {
  private readonly locale = inject(LocaleService);
  readonly average = input<number | null>(null);
  readonly total = input(0);
  protected readonly formatted = computed(() => {
    const value = this.average();
    return value === null
      ? ''
      : new Intl.NumberFormat(this.locale.language(), {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }).format(value);
  });
}
