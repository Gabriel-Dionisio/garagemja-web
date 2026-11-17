import { ChangeDetectionStrategy, Component, computed, input, output, inject } from '@angular/core';
import { LocaleService } from '../../../../core/i18n/locale-service';
import { moneyFormatter } from '../../../../shared/forms/format';
import { TranslocoPipe } from '@jsverse/transloco';
import { formatCep } from '../../../../shared/forms/masks';
import { Alert } from '../../../../shared/ui/alert/alert';
import { Badge } from '../../../../shared/ui/badge/badge';
import { Button } from '../../../../shared/ui/button/button';
import { Card } from '../../../../shared/ui/card/card';
import { FormActions } from '../../../../shared/ui/form-actions/form-actions';
import { Icon } from '../../../../shared/ui/icon/icon';
import { ScrollArea } from '../../../../shared/ui/scroll-area/scroll-area';
import { Condominium, CondominiumImage, CondominiumRules } from '../../condominium.model';
import { RESIDENT_STATUS_LABELS, RESIDENT_STATUS_TONES } from '../../resident-status';

@Component({
  selector: 'app-condominium-info',
  imports: [TranslocoPipe, Alert, Badge, Button, Card, FormActions, Icon, ScrollArea],
  templateUrl: './condominium-info.html',
  styleUrl: './condominium-info.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CondominiumInfo {
  private readonly locale = inject(LocaleService);
  protected readonly money = computed(() => moneyFormatter(this.locale.language()));
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
      { key: 'condominiumFeePercent', value: rules.condominiumFeePercent || null },
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
