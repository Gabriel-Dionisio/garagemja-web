import { ChipGroup, ChipOption } from '../../../../shared/ui/chip-group/chip-group';
import { DEFAULT_PAGE_SIZE, PAGE_SIZES } from '../../../../shared/ui/paginator/paginator';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { EMPTY, Subject, catchError, finalize, switchMap, tap } from 'rxjs';
import { ErrorText } from '../../../../core/i18n/error-text';
import { Page } from '../../../../shared/models/page';
import { Alert } from '../../../../shared/ui/alert/alert';
import { Button } from '../../../../shared/ui/button/button';
import { Icon } from '../../../../shared/ui/icon/icon';
import { IconButton } from '../../../../shared/ui/icon-button/icon-button';
import { AuthService } from '../../../../core/auth/auth-service';
import { ConfirmService } from '../../../../shared/ui/confirm-dialog/confirm-service';
import { FilterPanel } from '../../../../shared/ui/filter-panel/filter-panel';
import { ListItem } from '../../../../shared/ui/list-item/list-item';
import { ListState } from '../../../../shared/ui/list-state/list-state';
import { Page as PageLayout } from '../../../../shared/ui/page/page';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { Paginator } from '../../../../shared/ui/paginator/paginator';
import { UserSummary } from '../../../../shared/ui/user-summary/user-summary';
import { UserFilterForm } from '../../components/user-filter/user-filter';
import { UserStatusBadge } from '../../components/user-status-badge/user-status-badge';
import { UsersApi } from '../../data/users-api';
import { ROLE_LABELS } from '../../../../core/auth/role';
import { isUserStatus, STATUS_LABELS } from '../../user-status';
import { User, UserFilter, UserStatus } from '../../user.model';

const TABS: readonly (UserStatus | null)[] = [null, 'PENDING', 'ACTIVE', 'BLOCKED'];

@Component({
  selector: 'app-users-page',
  imports: [
    ChipGroup,
    TranslocoPipe,
    RouterLink,
    Alert,
    Button,
    FilterPanel,
    Icon,
    IconButton,
    ListItem,
    ListState,
    PageHeader,
    PageLayout,
    Paginator,
    UserFilterForm,
    UserStatusBadge,
    UserSummary,
  ],
  templateUrl: './users-page.html',
  styleUrl: './users-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersPage {
  private readonly errorText = inject(ErrorText);
  private readonly api = inject(UsersApi);
  private readonly auth = inject(AuthService);
  private readonly confirm = inject(ConfirmService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly query$ = new Subject<void>();
  private readonly filter = signal<UserFilter>({ email: '', cpf: '' });
  private readonly router = inject(Router);
  private readonly initialStatus = inject(ActivatedRoute).snapshot.queryParamMap.get('status');

  protected readonly roleLabels = ROLE_LABELS;
  protected readonly tabs: readonly ChipOption<UserStatus>[] = TABS.map((tab) => ({
    value: tab,
    labelKey: tab ? STATUS_LABELS[tab] : 'admin.users.all',
  }));
  protected readonly status = signal<UserFilter['status']>(
    isUserStatus(this.initialStatus) ? this.initialStatus : undefined,
  );
  protected readonly filtersOpen = signal(this.initialStatus !== null);
  protected readonly activeFilters = computed(
    () => [this.filter().email, this.filter().cpf, this.status()].filter(Boolean).length,
  );
  protected readonly result = signal<Page<User> | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = this.errorText.state();
  protected readonly page = signal(0);
  protected readonly size = signal(DEFAULT_PAGE_SIZE);
  protected readonly pageSizes = PAGE_SIZES;
  protected readonly busy = signal(false);
  protected readonly resetSent = signal(false);

  constructor() {
    this.query$
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.clear();
        }),
        switchMap(() =>
          this.api.list(this.currentFilter(), this.page(), this.size()).pipe(
            catchError((error: unknown) => {
              this.error.setFrom(error);
              this.loading.set(false);
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        this.result.set(result);
        this.loading.set(false);
      });
    this.query$.next();
  }

  protected selectStatus(status: UserStatus | null): void {
    this.status.set(status ?? undefined);
    this.page.set(0);
    this.query$.next();
    void this.router.navigate([], {
      queryParams: { status },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private currentFilter(): UserFilter {
    const status = this.status();
    return status ? { ...this.filter(), status } : this.filter();
  }

  protected applyFilter(filter: UserFilter): void {
    this.filter.set(filter);
    this.page.set(0);
    this.query$.next();
  }

  protected changeSize(size: number): void {
    this.size.set(size);
    this.page.set(0);
    this.query$.next();
  }

  protected goTo(page: number): void {
    this.page.set(page);
    this.query$.next();
  }

  protected canResetPassword(user: User): boolean {
    return user.status === 'ACTIVE' && user.id !== this.auth.user()?.id;
  }

  protected sendPasswordReset(user: User): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.clear();
    this.resetSent.set(false);
    this.confirm
      .confirm({
        title: 'admin.passwordResetDialog.title',
        message: 'admin.passwordResetDialog.message',
        confirmLabel: 'admin.passwordResetDialog.confirm',
      })
      .pipe(
        switchMap((confirmed) => (confirmed ? this.auth.sendPasswordReset(user.id) : EMPTY)),
        finalize(() => this.busy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.resetSent.set(true),
        error: (error: unknown) => this.error.setFrom(error),
      });
  }

  protected reactivate(user: User): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.clear();
    this.confirm
      .confirm({
        title: 'admin.reactivateDialog.title',
        message: 'admin.reactivateDialog.message',
        params: { name: user.name },
        confirmLabel: 'admin.reactivateDialog.confirm',
      })
      .pipe(
        switchMap((confirmed) =>
          confirmed ? this.api.update(user.id, { status: 'ACTIVE' }) : EMPTY,
        ),
        finalize(() => this.busy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.query$.next(),
        error: (error: unknown) => this.error.setFrom(error),
      });
  }

  protected canDeactivate(user: User): boolean {
    return user.status !== 'INACTIVE' && user.id !== this.auth.user()?.id;
  }

  protected deactivate(user: User): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.clear();
    this.confirm
      .confirm({
        title: 'admin.deactivateDialog.title',
        message: 'admin.deactivateDialog.message',
        params: { name: user.name },
        confirmLabel: 'admin.deactivateDialog.confirm',
        danger: true,
      })
      .pipe(
        switchMap((confirmed) => (confirmed ? this.api.deactivate(user.id) : EMPTY)),
        finalize(() => this.busy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.query$.next(),
        error: (error: unknown) => this.error.setFrom(error),
      });
  }
}
