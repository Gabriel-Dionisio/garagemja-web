import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { forkJoin } from 'rxjs';
import { ErrorText } from '../../../../core/i18n/error-text';
import { Alert } from '../../../../shared/ui/alert/alert';
import { Card } from '../../../../shared/ui/card/card';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { Icon } from '../../../../shared/ui/icon/icon';
import { IconButton } from '../../../../shared/ui/icon-button/icon-button';
import { LoadingBlock } from '../../../../shared/ui/loading-block/loading-block';
import { UsersApi } from '../../data/users-api';
import { User, UserStatus, UsersSummary } from '../../user.model';
import { UserStatusBadge } from '../user-status-badge/user-status-badge';
import { UserSummary } from '../user-summary/user-summary';

const LIST_SIZE = 5;

interface Kpi {
  key: keyof UsersSummary;
  status?: UserStatus;
  highlight?: boolean;
}

const KPIS: readonly Kpi[] = [
  { key: 'total' },
  { key: 'active', status: 'ACTIVE' },
  { key: 'pending', status: 'PENDING', highlight: true },
  { key: 'blocked', status: 'BLOCKED' },
];

@Component({
  selector: 'app-admin-dashboard',
  imports: [
    TranslocoPipe,
    RouterLink,
    Alert,
    Card,
    EmptyState,
    Icon,
    IconButton,
    LoadingBlock,
    UserStatusBadge,
    UserSummary,
  ],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboard {
  private readonly api = inject(UsersApi);
  private readonly errorText = inject(ErrorText);

  protected readonly kpis = KPIS;
  protected readonly summary = signal<UsersSummary | null>(null);
  protected readonly pending = signal<User[]>([]);
  protected readonly recent = signal<User[]>([]);
  protected readonly loaded = signal(false);
  protected readonly error = this.errorText.state();

  constructor() {
    forkJoin({
      summary: this.api.summary(),
      pending: this.api.list({ email: '', cpf: '', status: 'PENDING' }, 0, LIST_SIZE),
      recent: this.api.list({ email: '', cpf: '' }, 0, LIST_SIZE),
    })
      .pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe({
        next: (result) => {
          this.summary.set(result.summary);
          this.pending.set(result.pending.items);
          this.recent.set(result.recent.items);
          this.loaded.set(true);
        },
        error: (error: unknown) => this.error.setFrom(error),
      });
  }
}
