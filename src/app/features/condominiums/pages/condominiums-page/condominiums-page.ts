import { ChipGroup, ChipOption } from '../../../../shared/ui/chip-group/chip-group';
import { DEFAULT_PAGE_SIZE, PAGE_SIZES } from '../../../../shared/ui/paginator/paginator';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  untracked,
  inject,
  input,
  signal,
} from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EMPTY, catchError, filter, finalize, switchMap } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth-service';
import { ErrorText } from '../../../../core/i18n/error-text';
import { Page } from '../../../../shared/models/page';
import { ActionItem } from '../../../../shared/ui/action-list/action-item';
import { Alert } from '../../../../shared/ui/alert/alert';
import { Badge } from '../../../../shared/ui/badge/badge';
import { Button } from '../../../../shared/ui/button/button';
import { ConfirmService } from '../../../../shared/ui/confirm-dialog/confirm-service';
import { Fab } from '../../../../shared/ui/fab/fab';
import { FilterPanel } from '../../../../shared/ui/filter-panel/filter-panel';
import { Icon } from '../../../../shared/ui/icon/icon';
import { IconButton } from '../../../../shared/ui/icon-button/icon-button';
import { ListItem } from '../../../../shared/ui/list-item/list-item';
import { ListState } from '../../../../shared/ui/list-state/list-state';
import { Page as PageLayout } from '../../../../shared/ui/page/page';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { Paginator } from '../../../../shared/ui/paginator/paginator';
import { CondominiumFilterForm } from '../../components/condominium-filter/condominium-filter';
import { CondominiumStatusBadge } from '../../components/condominium-status-badge';
import { JoinDialog, JoinDialogData } from '../../components/join-dialog/join-dialog';
import { ReceivedInvites } from '../../components/received-invites/received-invites';
import { WelcomeCards } from '../../components/welcome-cards/welcome-cards';
import { Condominium, CondominiumFilter, CondominiumStatus } from '../../condominium.model';
import { STATUS_ACTIONS, StatusAction, askStatusChange } from '../../condominium-status-actions';
import { CONDOMINIUM_STATUS_LABELS, isCondominiumStatus } from '../../condominium-status';
import { CondominiumsApi } from '../../data/condominiums-api';
import { RESIDENT_STATUS_LABELS, RESIDENT_STATUS_TONES } from '../../resident-status';

const TABS: readonly (CondominiumStatus | null)[] = [
  null,
  'PENDING',
  'ACTIVE',
  'REJECTED',
  'BLOCKED',
  'CLOSED',
];

@Component({
  selector: 'app-condominiums-page',
  imports: [
    Badge,
    ChipGroup,
    TranslocoPipe,
    RouterLink,
    ActionItem,
    Alert,
    Button,
    Fab,
    Icon,
    IconButton,
    ListItem,
    ListState,
    PageHeader,
    PageLayout,
    Paginator,
    CondominiumFilterForm,
    FilterPanel,
    CondominiumStatusBadge,
    ReceivedInvites,
    WelcomeCards,
  ],
  templateUrl: './condominiums-page.html',
  styleUrl: './condominiums-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CondominiumsPage {
  private readonly api = inject(CondominiumsApi);
  private readonly errorText = inject(ErrorText);
  private readonly auth = inject(AuthService);
  private readonly confirm = inject(ConfirmService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(Dialog);

  protected readonly tabs: readonly ChipOption<CondominiumStatus>[] = TABS.map((tab) => ({
    value: tab,
    labelKey: tab ? CONDOMINIUM_STATUS_LABELS[tab] : 'condominiums.list.all',
  }));
  protected readonly isAdmin = computed(() => this.auth.hasRole('ADMIN'));
  readonly code = input<string>();

  protected readonly residencyTones = RESIDENT_STATUS_TONES;
  protected readonly residencyLabels = RESIDENT_STATUS_LABELS;
  protected readonly pending = signal<Record<string, number>>({});
  protected readonly joined = signal(false);
  private readonly initialStatus = inject(ActivatedRoute).snapshot.queryParamMap.get('status');

  protected readonly status = signal<CondominiumStatus | null>(
    isCondominiumStatus(this.initialStatus) ? this.initialStatus : null,
  );
  protected readonly page = signal(0);
  protected readonly size = signal(DEFAULT_PAGE_SIZE);
  protected readonly pageSizes = PAGE_SIZES;
  protected readonly search = signal<CondominiumFilter>({});
  protected readonly activeFilters = computed(
    () => Object.values(this.search()).filter(Boolean).length + (this.status() ? 1 : 0),
  );
  protected readonly result = signal<Page<Condominium> | null>(null);
  protected readonly filtersOpen = signal(this.initialStatus !== null);
  protected readonly loading = signal(true);
  protected readonly busy = signal(false);
  protected readonly error = this.errorText.state({
    403: 'errors.condominium.forbidden',
    404: 'errors.condominium.notFound',
  });
  protected readonly showWelcome = computed(() => {
    const current = this.result();
    return (
      !this.isAdmin() &&
      !this.loading() &&
      current?.items.length === 0 &&
      this.activeFilters() === 0
    );
  });
  private readonly reload = signal(0);

  constructor() {
    effect(() => {
      const code = this.code();
      if (code) untracked(() => this.openJoin({ code }));
    });

    toObservable(
      computed(() => ({
        filter: { ...this.search(), status: this.status() ?? undefined, mine: !this.isAdmin() },
        page: this.page(),
        size: this.size(),
        reload: this.reload(),
      })),
    )
      .pipe(
        switchMap(({ filter, page, size }) => {
          this.loading.set(true);
          this.error.clear();
          return this.api.list(filter, page, size).pipe(
            catchError((error: unknown) => {
              this.error.setFrom(error);
              this.result.set(null);
              return EMPTY;
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((result) => this.result.set(result));
    if (!this.isAdmin() && this.auth.hasRole('CONDOMINIUM_ADMIN')) this.loadPending();
  }

  private loadPending(): void {
    this.api
      .managed(0, 100)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ items }) =>
          this.pending.set(
            Object.fromEntries(items.map((item) => [item.id, item.pendingResidents])),
          ),
        error: () => undefined,
      });
  }

  protected applyFilter(filter: CondominiumFilter): void {
    this.page.set(0);
    this.search.set(filter);
  }

  protected openJoin(data: JoinDialogData = {}): void {
    this.dialog
      .open<boolean>(JoinDialog, { data, ariaLabelledBy: 'join-title' })
      .closed.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((joined) => {
        if (!joined) return;
        this.joined.set(true);
        this.refresh();
      });
  }

  protected leave(condominium: Condominium): void {
    const residency = condominium.residency;
    if (!residency) return;
    this.confirm
      .confirm({
        title: 'condominiums.residencies.leave.title',
        message: 'condominiums.residencies.leave.message',
        params: { name: condominium.name },
        confirmLabel: 'condominiums.residencies.leave.confirm',
        danger: true,
      })
      .pipe(
        filter(Boolean),
        switchMap(() => this.api.leaveResidency(residency.id)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.reload.update((n) => n + 1),
        error: (error: unknown) => this.error.setFrom(error),
      });
  }

  protected refresh(): void {
    this.page.set(0);
    this.reload.update((n) => n + 1);
    if (this.auth.hasRole('CONDOMINIUM_ADMIN')) this.loadPending();
  }

  protected selectStatus(status: CondominiumStatus | null): void {
    this.page.set(0);
    this.status.set(status);
  }

  protected changeSize(size: number): void {
    this.size.set(size);
    this.page.set(0);
  }

  protected goTo(page: number): void {
    this.page.set(page);
  }

  protected rowActions(condominium: Condominium): StatusAction[] {
    return this.isAdmin() ? STATUS_ACTIONS[condominium.status] : [];
  }

  protected changeStatus(condominium: Condominium, action: StatusAction): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.clear();
    askStatusChange(this.confirm, action, condominium.name)
      .pipe(
        switchMap((statusReason) =>
          statusReason === null
            ? EMPTY
            : this.api.update(condominium.id, {
                status: action.status,
                statusReason: statusReason || undefined,
              }),
        ),
        finalize(() => this.busy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.reload.update((n) => n + 1),
        error: (error: unknown) => this.error.setFrom(error),
      });
  }
}
