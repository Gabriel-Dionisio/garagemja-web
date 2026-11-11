import { TranslocoPipe } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Badge } from '../../../shared/ui/badge/badge';
import { CondominiumStatus } from '../condominium.model';
import { CONDOMINIUM_STATUS_LABELS, CONDOMINIUM_STATUS_TONES } from '../condominium-status';

@Component({
  selector: 'app-condominium-status-badge',
  imports: [TranslocoPipe, Badge],
  template: '<app-badge [tone]="tone()">{{ label() | transloco }}</app-badge>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CondominiumStatusBadge {
  readonly status = input.required<CondominiumStatus>();
  protected readonly tone = computed(() => CONDOMINIUM_STATUS_TONES[this.status()]);
  protected readonly label = computed(() => CONDOMINIUM_STATUS_LABELS[this.status()]);
}
