import { TranslocoPipe } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Badge, BadgeTone } from '../../../../shared/ui/badge/badge';
import { UserStatus } from '../../user.model';
import { STATUS_LABELS } from '../../user-status';

const TONES: Record<UserStatus, BadgeTone> = {
  PENDING: 'warning',
  ACTIVE: 'success',
  BLOCKED: 'danger',
  INACTIVE: 'neutral',
};

@Component({
  selector: 'app-user-status-badge',
  imports: [TranslocoPipe, Badge],
  template: '<app-badge [tone]="tone()">{{ label() | transloco }}</app-badge>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserStatusBadge {
  readonly status = input.required<UserStatus>();
  protected readonly tone = computed(() => TONES[this.status()]);
  protected readonly label = computed(() => STATUS_LABELS[this.status()]);
}
