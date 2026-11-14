import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { AuthService } from '../../../../core/auth/auth-service';
import { Button } from '../../../../shared/ui/button/button';
import { ChipGroup, ChipOption } from '../../../../shared/ui/chip-group/chip-group';
import { Icon } from '../../../../shared/ui/icon/icon';
import { Page } from '../../../../shared/ui/page/page';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { AdminDashboard } from '../../components/admin-dashboard/admin-dashboard';
import { ManagerDashboard } from '../../components/manager-dashboard/manager-dashboard';
import { OwnerDashboard } from '../../components/owner-dashboard/owner-dashboard';

type DashboardView = 'platform' | 'manager' | 'owner';

@Component({
  selector: 'app-dashboard-page',
  imports: [
    RouterLink,
    TranslocoPipe,
    Button,
    ChipGroup,
    Icon,
    Page,
    PageHeader,
    AdminDashboard,
    ManagerDashboard,
    OwnerDashboard,
  ],
  templateUrl: './dashboard-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage {
  private readonly auth = inject(AuthService);
  private readonly transloco = inject(TranslocoService);

  protected readonly views = computed<readonly DashboardView[]>(() => {
    const views: DashboardView[] = [];
    if (this.auth.hasRole('ADMIN')) views.push('platform');
    if (this.auth.hasRole('CONDOMINIUM_ADMIN')) views.push('manager');
    if (this.auth.hasRole('RESIDENT') || views.length === 0) views.push('owner');
    return views;
  });
  protected readonly options = computed<readonly ChipOption<DashboardView>[]>(() =>
    this.views().map((value) => ({ value, labelKey: `dashboard.sections.${value}` })),
  );
  private readonly chosen = signal<DashboardView | null>(null);
  protected readonly view = computed(() => {
    const chosen = this.chosen();
    return chosen && this.views().includes(chosen) ? chosen : this.views()[0];
  });
  private readonly spots = signal<number | null>(null);
  protected readonly subtitle = computed(() => {
    const spots = this.spots();
    return this.view() === 'owner' && spots
      ? this.transloco.translate('dashboard.ownerSubtitle', { count: spots })
      : this.transloco.translate('dashboard.subtitle');
  });

  protected choose(view: DashboardView | null): void {
    if (view) this.chosen.set(view);
  }

  protected setSpots(count: number): void {
    this.spots.set(count);
  }
}
