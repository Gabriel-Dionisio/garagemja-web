import { Dialog } from '@angular/cdk/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Badge } from '../../../shared/ui/badge/badge';
import { Icon } from '../../../shared/ui/icon/icon';
import { IconButton } from '../../../shared/ui/icon-button/icon-button';
import { ViewportService } from '../../layout/viewport-service';
import { NotificationPanel } from '../notification-panel/notification-panel';
import { NotificationsStore } from '../notifications-store';

@Component({
  selector: 'app-notification-bell',
  imports: [TranslocoPipe, Badge, Icon, IconButton],
  templateUrl: './notification-bell.html',
  styleUrl: './notification-bell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationBell {
  private readonly dialog = inject(Dialog);
  private readonly overlay = inject(Overlay);
  private readonly viewport = inject(ViewportService);
  protected readonly store = inject(NotificationsStore);

  constructor() {
    this.store.start();
    inject(DestroyRef).onDestroy(() => this.store.stop());
  }

  protected open(): void {
    this.dialog.open(NotificationPanel, {
      ariaLabelledBy: 'notifications-title',
      width: this.viewport.usesDrawer() ? '100vw' : 'min(26rem, 100vw)',
      height: '100dvh',
      maxWidth: '100vw',
      positionStrategy: this.overlay.position().global().top('0').right('0'),
    });
  }
}
