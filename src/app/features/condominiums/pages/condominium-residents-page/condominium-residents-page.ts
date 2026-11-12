import { TranslocoPipe } from '@jsverse/transloco';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { EMPTY, Observable, catchError, finalize, forkJoin, switchMap } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth-service';
import { ErrorText } from '../../../../core/i18n/error-text';
import { NavBadges } from '../../../../core/layout/nav-badges';
import { Page } from '../../../../shared/models/page';
import { Alert } from '../../../../shared/ui/alert/alert';
import { Badge } from '../../../../shared/ui/badge/badge';
import { Card } from '../../../../shared/ui/card/card';
import { ChipGroup, ChipOption } from '../../../../shared/ui/chip-group/chip-group';
import { CondominiumTabs } from '../../../../shared/ui/condominium-tabs/condominium-tabs';
import { CondominiumTabsState } from '../../../../shared/ui/condominium-tabs/condominium-tabs-state';
import { ConfirmService } from '../../../../shared/ui/confirm-dialog/confirm-service';
import { FilterPanel } from '../../../../shared/ui/filter-panel/filter-panel';
import { Icon, IconName } from '../../../../shared/ui/icon/icon';
import { IconButton } from '../../../../shared/ui/icon-button/icon-button';
import { ListItem } from '../../../../shared/ui/list-item/list-item';
import { ListState } from '../../../../shared/ui/list-state/list-state';
import { Page as PageLayout } from '../../../../shared/ui/page/page';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZES,
  Paginator,
} from '../../../../shared/ui/paginator/paginator';
import { Skeleton } from '../../../../shared/ui/skeleton/skeleton';
import { SkeletonBlock } from '../../../../shared/ui/skeleton/skeleton-block';
import { UserSummary } from '../../../../shared/ui/user-summary/user-summary';
import { JoinCodeCard } from '../../components/join-code-card/join-code-card';
import { ResidentFilterForm } from '../../components/resident-filter/resident-filter';
import { Condominium, ResidentMember, ResidentStatus } from '../../condominium.model';
import { CondominiumsApi } from '../../data/condominiums-api';
import {
  RESIDENT_STATUS_LABELS,
  RESIDENT_STATUS_TONES,
  isResidentStatus,
} from '../../resident-status';

const SKELETON_ROWS = [0, 1, 2, 3];

const TABS: readonly (ResidentStatus | null)[] = [
  null,
  'PENDING',
  'APPROVED',
  'REJECTED',
  'BLOCKED',
];

interface ResidentAction {
  key: 'approve' | 'reject' | 'block' | 'reactivate';
  status: ResidentStatus;
  icon: IconName;
  primary: boolean;
}

const ACTIONS: Record<ResidentStatus, readonly ResidentAction[]> = {
  PENDING: [
    { key: 'approve', status: 'APPROVED', icon: 'check', primary: true },
    { key: 'reject', status: 'REJECTED', icon: 'close', primary: false },
  ],
  APPROVED: [{ key: 'block', status: 'BLOCKED', icon: 'ban', primary: false }],
  REJECTED: [{ key: 'reactivate', status: 'APPROVED', icon: 'user-check', primary: true }],
  BLOCKED: [{ key: 'reactivate', status: 'APPROVED', icon: 'user-check', primary: true }],
};

@Component({
  selector: 'app-condominium-residents-page',
  imports: [
    TranslocoPipe,
    Alert,
    Badge,
    Card,
    ChipGroup,
    CondominiumTabs,
    FilterPanel,
    Icon,
    IconButton,
    JoinCodeCard,
    ListItem,
    ListState,
    PageHeader,
    PageLayout,
    Paginator,
    ResidentFilterForm,
    Skeleton,
    SkeletonBlock,
    UserSummary,
  ],
  templateUrl: './condominium-residents-page.html',
  styleUrl: './condominium-residents-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CondominiumResidentsPage {
  private readonly api = inject(CondominiumsApi);
  private readonly auth = inject(AuthService);
  private readonly confirm = inject(ConfirmService);
  private readonly errorText = inject(ErrorText);
  private readonly navBadges = inject(NavBadges);
  private readonly tabsState = inject(CondominiumTabsState);
  private readonly destroyRef = inject(DestroyRef);
  private readonly initialStatus = inject(ActivatedRoute).snapshot.queryParamMap.get('status');

  readonly id = input.required<string>();

  protected readonly tabs: readonly ChipOption<ResidentStatus>[] = TABS.map((tab) => ({
    value: tab,
    labelKey: tab ? `condominiums.residents.tabs.${tab}` : 'condominiums.residents.tabs.all',
  }));
  protected readonly tones = RESIDENT_STATUS_TONES;
  protected readonly statusLabels = RESIDENT_STATUS_LABELS;
  protected readonly pageSizes = PAGE_SIZES;
  protected readonly ownUserId = computed(() => this.auth.user()?.id);
  protected readonly condominium = signal<Condominium | null>(null);
  protected readonly code = signal('');
  protected readonly status = signal<ResidentStatus | null>(
    isResidentStatus(this.initialStatus) ? this.initialStatus : null,
  );
  protected readonly skeletonRows = SKELETON_ROWS;
  protected readonly knownName = computed(() => this.tabsState.nameOf(this.id()));
  protected readonly search = signal('');
  protected readonly filtersOpen = signal(this.initialStatus !== null);
  protected readonly inviteOpen = signal(false);
  protected readonly activeFilters = computed(
    () => (this.status() ? 1 : 0) + (this.search() ? 1 : 0),
  );
  protected readonly page = signal(0);
  protected readonly size = signal(DEFAULT_PAGE_SIZE);
  protected readonly result = signal<Page<ResidentMember> | null>(null);
  protected readonly loading = signal(true);
  protected readonly listLoading = signal(true);
  protected readonly busy = signal(false);
  protected readonly error = this.errorText.state({
    403: 'errors.condominium.forbidden',
    404: 'errors.condominium.notFound',
  });
  private readonly reloads = signal(0);

  constructor() {
    toObservable(this.id)
      .pipe(
        switchMap((id) => {
          this.loading.set(true);
          this.error.clear();
          return forkJoin({
            condominium: this.api.get(id),
            code: this.api.joinCode(id),
          }).pipe(
            catchError((error: unknown) => {
              this.error.setFrom(error);
              this.loading.set(false);
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe(({ condominium, code }) => {
        this.condominium.set(condominium);
        this.tabsState.set(condominium, this.auth.hasRole('ADMIN'));
        this.code.set(code);
        this.loading.set(false);
      });

    toObservable(
      computed(() => ({
        id: this.id(),
        status: this.status(),
        search: this.search(),
        page: this.page(),
        size: this.size(),
        reload: this.reloads(),
      })),
    )
      .pipe(
        switchMap(({ id, status, search, page, size }) => {
          this.listLoading.set(true);
          return this.api.residents(id, status, search, page, size).pipe(
            catchError((error: unknown) => {
              this.error.setFrom(error);
              this.result.set(null);
              return EMPTY;
            }),
            finalize(() => this.listLoading.set(false)),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((result) => this.result.set(result));
  }

  protected actionsFor(resident: ResidentMember): readonly ResidentAction[] {
    return resident.userId === this.ownUserId() ? [] : ACTIONS[resident.status];
  }

  protected awaitsEmail(resident: ResidentMember): boolean {
    return resident.status === 'PENDING' && !resident.emailVerified;
  }

  protected place(resident: ResidentMember): string {
    return [resident.block, resident.unit].filter(Boolean).join(' / ');
  }

  protected selectStatus(status: ResidentStatus | null): void {
    this.status.set(status);
    this.page.set(0);
  }

  protected applySearch(search: string): void {
    this.search.set(search);
    this.page.set(0);
  }

  protected changeSize(size: number): void {
    this.size.set(size);
    this.page.set(0);
  }

  protected goTo(page: number): void {
    this.page.set(page);
  }

  protected decide(resident: ResidentMember, action: ResidentAction): void {
    this.run(this.api.decideResident(resident.id, action.status), () => {
      this.reloads.update((count) => count + 1);
      this.navBadges.refresh();
    });
  }

  protected rotate(): void {
    this.run(
      this.confirm
        .confirm({
          title: 'condominiums.residents.rotate.title',
          message: 'condominiums.residents.rotate.message',
          confirmLabel: 'condominiums.residents.rotate.confirm',
          danger: true,
        })
        .pipe(switchMap((confirmed) => (confirmed ? this.api.rotateJoinCode(this.id()) : EMPTY))),
      (code) => this.code.set(code),
    );
  }

  private run<T>(call: Observable<T>, onDone: (value: T) => void): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.clear();
    call
      .pipe(
        finalize(() => this.busy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: onDone,
        error: (error: unknown) => this.error.setFrom(error),
      });
  }
}
