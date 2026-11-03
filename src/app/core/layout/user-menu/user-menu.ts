import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { filter } from 'rxjs';
import { Avatar } from '../../../shared/ui/avatar/avatar';
import { Badge } from '../../../shared/ui/badge/badge';
import { Icon } from '../../../shared/ui/icon/icon';
import { UserProfile } from '../../auth/auth.model';
import { ROLE_LABELS } from '../../auth/role';

@Component({
  selector: 'app-user-menu',
  imports: [TranslocoPipe, Avatar, Badge, Icon],
  templateUrl: './user-menu.html',
  styleUrl: './user-menu.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:click)': 'closeOnOutsideClick($event)' },
})
export class UserMenu {
  readonly user = input.required<UserProfile>();
  readonly loggingOut = input(false);
  readonly logout = output<void>();

  protected readonly open = signal(false);
  protected readonly roleLabels = ROLE_LABELS;
  protected readonly firstName = computed(() => this.user().name.trim().split(/\s+/)[0] ?? '');
  protected readonly badgeRoles = computed(() =>
    this.user().roles.filter((role) => role !== 'RESIDENT'),
  );

  constructor() {
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe(() => this.open.set(false));
  }

  protected closeOnOutsideClick(event: Event): void {
    if (this.open() && !(event.target as Element).closest('app-user-menu')) this.open.set(false);
  }
}
