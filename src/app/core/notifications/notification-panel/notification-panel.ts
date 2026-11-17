import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoPipe } from '@jsverse/transloco';
import { dateTimeFormatter } from '../../../shared/forms/format';
import { Button } from '../../../shared/ui/button/button';
import { Icon } from '../../../shared/ui/icon/icon';
import { IconButton } from '../../../shared/ui/icon-button/icon-button';
import { ListItem } from '../../../shared/ui/list-item/list-item';
import { ListState } from '../../../shared/ui/list-state/list-state';
import { LocaleService } from '../../i18n/locale-service';
import { NotificationsStore } from '../notifications-store';

@Component({
  selector: 'app-notification-panel',
  imports: [TranslocoPipe, Button, Icon, IconButton, ListItem, ListState],
  templateUrl: './notification-panel.html',
  styleUrl: './notification-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationPanel {
  private readonly ref = inject(DialogRef);
  private readonly locale = inject(LocaleService);
  protected readonly store = inject(NotificationsStore);
  protected readonly dateTime = computed(() => dateTimeFormatter(this.locale.language()));

  constructor() {
    this.store.open();
    this.ref.closed.pipe(takeUntilDestroyed()).subscribe(() => this.store.close());
  }

  protected close(): void {
    this.ref.close();
  }
}
