import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthService } from '../../../../core/auth/auth-service';
import { Page } from '../../../../shared/ui/page/page';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { AdminDashboard } from '../../components/admin-dashboard/admin-dashboard';
import { ManagerDashboard } from '../../components/manager-dashboard/manager-dashboard';
import { RentalsList } from '../../components/rentals-list/rentals-list';
import { OwnerDashboard } from '../../components/owner-dashboard/owner-dashboard';

@Component({
  selector: 'app-dashboard-page',
  imports: [
    TranslocoPipe,
    Page,
    PageHeader,
    AdminDashboard,
    ManagerDashboard,
    OwnerDashboard,
    RentalsList,
  ],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage {
  private readonly auth = inject(AuthService);
  protected readonly isAdmin = () => this.auth.hasRole('ADMIN');
  protected readonly isManager = () => this.auth.hasRole('CONDOMINIUM_ADMIN');
}
