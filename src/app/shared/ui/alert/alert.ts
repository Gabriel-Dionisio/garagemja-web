import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Icon, IconName } from '../icon/icon';

export type AlertKind = 'error' | 'success' | 'info' | 'warning';

const ICONS: Record<AlertKind, IconName> = {
  error: 'alert',
  success: 'check',
  info: 'info',
  warning: 'alert',
};

@Component({
  selector: 'app-alert',
  imports: [Icon],
  templateUrl: './alert.html',
  styleUrl: './alert.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-kind]': 'kind()',
    '[attr.role]': 'kind() === "error" ? "alert" : "status"',
  },
})
export class Alert {
  readonly kind = input<AlertKind>('info');
  protected readonly icon = computed(() => ICONS[this.kind()]);
}
