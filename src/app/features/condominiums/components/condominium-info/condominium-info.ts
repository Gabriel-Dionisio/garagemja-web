import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';
import { formatCep } from '../../../../shared/forms/masks';
import { Alert } from '../../../../shared/ui/alert/alert';
import { Badge } from '../../../../shared/ui/badge/badge';
import { Button } from '../../../../shared/ui/button/button';
import { Card } from '../../../../shared/ui/card/card';
import { Icon } from '../../../../shared/ui/icon/icon';
import { Condominium, CondominiumImage, CondominiumRules } from '../../condominium.model';
import { RESIDENT_STATUS_LABELS, RESIDENT_STATUS_TONES } from '../../resident-status';

@Component({
  selector: 'app-condominium-info',
  imports: [TranslocoPipe, CurrencyPipe, Alert, Badge, Button, Card, Icon],
  templateUrl: './condominium-info.html',
  styleUrl: './condominium-info.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CondominiumInfo {
  readonly condominium = input.required<Condominium>();
  readonly images = input<readonly CondominiumImage[]>([]);
  readonly rules = input<CondominiumRules | null>(null);
  readonly busy = input(false);
  readonly leave = output<void>();

  protected readonly tones = RESIDENT_STATUS_TONES;
  protected readonly statusLabels = RESIDENT_STATUS_LABELS;
  protected readonly zipCode = computed(() => formatCep(this.condominium().zipCode ?? ''));
  protected readonly gallery = computed(() => {
    const cover = this.condominium().imageUrl;
    const urls = this.images().map((image) => image.url);
    return urls.length > 0 ? urls : cover ? [cover] : [];
  });
  protected readonly place = computed(() => {
    const residency = this.condominium().residency;
    return [residency?.block, residency?.unit].filter(Boolean).join(' / ');
  });
  protected readonly ruleItems = computed(() => {
    const rules = this.rules();
    if (!rules) return [];
    return [
      { key: 'maxRentalDays', value: rules.maxRentalDays },
      { key: 'minAdvanceHours', value: rules.minAdvanceHours },
      { key: 'cancellationDeadlineHours', value: rules.cancellationDeadlineHours },
    ].filter((item) => item.value !== null);
  });

  protected readonly street = computed(() => {
    const { address, number } = this.condominium();
    return [address, number].filter(Boolean).join(', ');
  });

  protected readonly region = computed(() => {
    const { district, city, state } = this.condominium();
    const place = [city, state].filter(Boolean).join(' / ');
    return [district, place].filter(Boolean).join(' · ');
  });
}
