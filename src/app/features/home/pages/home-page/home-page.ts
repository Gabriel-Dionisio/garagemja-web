import { TranslocoPipe } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AuthService } from '../../../../core/auth/auth-service';
import { AdminDashboard } from '../../../admin/components/admin-dashboard/admin-dashboard';
import { Card } from '../../../../shared/ui/card/card';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';

@Component({
  selector: 'app-home-page',
  imports: [TranslocoPipe, AdminDashboard, Card, EmptyState, PageHeader],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  private readonly auth = inject(AuthService);

  protected readonly name = computed(() => this.auth.user()?.name.split(' ')[0] ?? '');
  protected readonly isAdmin = computed(() => this.auth.hasRole('ADMIN'));
}
