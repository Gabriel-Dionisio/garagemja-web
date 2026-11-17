import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { dateTimeFormatter } from '../../../shared/forms/format';
import { Alert } from '../../../shared/ui/alert/alert';
import { Button } from '../../../shared/ui/button/button';
import { Icon } from '../../../shared/ui/icon/icon';
import { IconButton } from '../../../shared/ui/icon-button/icon-button';
import { ListItem } from '../../../shared/ui/list-item/list-item';
import { ListState } from '../../../shared/ui/list-state/list-state';
import { LocaleService } from '../../i18n/locale-service';
import { AppNotification, notificationDestination } from '../notification.model';
import { NotificationsStore } from '../notifications-store';

@Component({
  selector: 'app-notification-panel',
  imports: [TranslocoPipe, Alert, Button, Icon, IconButton, ListItem, ListState],
  templateUrl: './notification-panel.html',
  styleUrl: './notification-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationPanel {
  private readonly ref = inject(DialogRef);
  private readonly transloco = inject(TranslocoService);
  private readonly router = inject(Router);
  private readonly locale = inject(LocaleService);
  protected readonly store = inject(NotificationsStore);
  protected readonly dateTime = computed(() => dateTimeFormatter(this.locale.language()));

  constructor() {
    this.store.open();
    this.ref.closed.pipe(takeUntilDestroyed()).subscribe(() => this.store.close());
  }

  protected secondary(item: AppNotification): string {
    const date = this.dateTime()(item.createdAt);
    if (!item.reason) return date;
    return `${this.transloco.translate('notifications.reason', { reason: item.reason })} · ${date}`;
  }

  protected openItem(item: AppNotification): void {
    this.store.markRead(item.id);
    const destination = notificationDestination(item.kind);
    if (!destination) return;
    this.ref.close();
    void this.router.navigateByUrl(destination);
  }

  protected close(): void {
    this.ref.close();
  }
}
