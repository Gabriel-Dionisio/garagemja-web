import { CondominiumTabsState } from '../../../../shared/ui/condominium-tabs/condominium-tabs-state';
import { ChipGroup, ChipOption } from '../../../../shared/ui/chip-group/chip-group';
import { DEFAULT_PAGE_SIZE, PAGE_SIZES } from '../../../../shared/ui/paginator/paginator';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
  WritableSignal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { EMPTY, Observable, catchError, finalize, map, switchMap } from 'rxjs';
import { Language } from '../../../../core/i18n/locale-service';
import { AuthService } from '../../../../core/auth/auth-service';
import { ErrorText } from '../../../../core/i18n/error-text';
import { EntityLookup } from '../../../../shared/lookup/entity-lookup';
import { LookupField, LookupOption } from '../../../../shared/ui/lookup-field/lookup-field';
import { timeZoneLabel, utcOffsetLabel } from '../../../../shared/forms/time-zone';
import { Page } from '../../../../shared/models/page';
import { DateField } from '../../../../shared/ui/date-field/date-field';
import { Badge, BadgeTone } from '../../../../shared/ui/badge/badge';
import { Button } from '../../../../shared/ui/button/button';
import { CondominiumTabs } from '../../../../shared/ui/condominium-tabs/condominium-tabs';
import { Icon } from '../../../../shared/ui/icon/icon';
import { ListItem } from '../../../../shared/ui/list-item/list-item';
import { ListState } from '../../../../shared/ui/list-state/list-state';
import { Page as PageLayout } from '../../../../shared/ui/page/page';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { Paginator } from '../../../../shared/ui/paginator/paginator';
import { diffAudit } from '../../audit-diff';
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  AuditAction,
  AuditEntityType,
  AuditLog,
  AuditLogFilter,
  isAuditAction,
  isAuditEntityType,
} from '../../audit-log.model';
import { AuditLogsApi } from '../../data/audit-logs-api';

const ACTION_TONES: Record<AuditAction, BadgeTone> = {
  CREATE: 'success',
  UPDATE: 'info',
  DELETE: 'danger',
  STATUS_CHANGE: 'warning',
  TRANSFER: 'neutral',
};

@Component({
  selector: 'app-audit-logs-page',
  imports: [
    DateField,
    ChipGroup,
    TranslocoPipe,
    DatePipe,
    Badge,
    Button,
    Icon,
    CondominiumTabs,
    ListItem,
    ListState,
    LookupField,
    PageLayout,
    PageHeader,
    Paginator,
  ],
  templateUrl: './audit-logs-page.html',
  styleUrl: './audit-logs-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditLogsPage {
  private readonly api = inject(AuditLogsApi);
  private readonly auth = inject(AuthService);
  private readonly tabsState = inject(CondominiumTabsState);
  private readonly errorText = inject(ErrorText);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly lookup = inject(EntityLookup);
  private readonly language = toSignal(inject(TranslocoService).langChanges$, {
    requireSync: true,
  });

  protected readonly entityOptions: readonly ChipOption<AuditEntityType>[] = [
    { value: null, labelKey: 'audit.filters.all' },
    ...AUDIT_ENTITY_TYPES.map((value) => ({ value, labelKey: `audit.entity.${value}` })),
  ];
  protected readonly actionOptions: readonly ChipOption<AuditAction>[] = [
    { value: null, labelKey: 'audit.filters.all' },
    ...AUDIT_ACTIONS.map((value) => ({ value, labelKey: `audit.action.${value}` })),
  ];
  protected readonly actionTones = ACTION_TONES;
  protected readonly condominiumId = this.route.snapshot.paramMap.get('id') ?? undefined;
  protected readonly knownName = computed(() => this.tabsState.nameOf(this.condominiumId ?? ''));
  protected readonly backLink = this.condominiumId ? `/condominiums/${this.condominiumId}` : null;

  private readonly query = this.route.snapshot.queryParamMap;
  protected readonly entityType = signal<AuditEntityType | null>(
    isAuditEntityType(this.query.get('entityType'))
      ? (this.query.get('entityType') as AuditEntityType)
      : null,
  );
  protected readonly action = signal<AuditAction | null>(
    isAuditAction(this.query.get('action')) ? (this.query.get('action') as AuditAction) : null,
  );
  private readonly entityId = this.query.get('entityId') ?? undefined;
  protected readonly user = signal<LookupOption | null>(this.initialOption('userId'));
  protected readonly condominium = signal<LookupOption | null>(this.initialOption('condominiumId'));
  protected readonly from = signal(this.query.get('createdFrom')?.slice(0, 10) ?? '');
  protected readonly to = signal(this.query.get('createdTo')?.slice(0, 10) ?? '');

  protected readonly activeFilters = computed(
    () =>
      [
        this.entityType(),
        this.action(),
        this.user(),
        this.condominium(),
        this.from(),
        this.to(),
      ].filter(Boolean).length,
  );
  protected readonly filtersOpen = signal(this.activeFilters() > 0);

  protected readonly page = signal(0);
  protected readonly size = signal(DEFAULT_PAGE_SIZE);
  protected readonly pageSizes = PAGE_SIZES;
  protected readonly result = signal<Page<AuditLog> | null>(null);
  protected readonly loading = signal(true);
  protected readonly expanded = signal<string | null>(null);
  protected readonly isAdmin = computed(() => this.auth.hasRole('ADMIN'));
  protected readonly error = this.errorText.state({
    403: 'errors.condominium.forbidden',
    404: 'errors.condominium.notFound',
  });

  private readonly filter = computed<AuditLogFilter>(() => ({
    entityType: this.entityType() ?? undefined,
    action: this.action() ?? undefined,
    entityId: this.entityId,
    userId: this.isAdmin() ? this.user()?.id : undefined,
    condominiumId: this.condominium()?.id,
    createdFrom: this.from() ? startOfDay(this.from()) : undefined,
    createdTo: this.to() ? endOfDay(this.to()) : undefined,
  }));
  protected readonly exportUrl = computed(() =>
    this.api.exportUrl(this.filter(), this.condominiumId),
  );

  constructor() {
    this.resolveLabels();
    toObservable(computed(() => ({ filter: this.filter(), page: this.page(), size: this.size() })))
      .pipe(
        switchMap(({ filter, page, size }) => {
          this.loading.set(true);
          this.error.clear();
          return this.api.list(filter, page, size, this.condominiumId).pipe(
            catchError((error: unknown) => {
              this.error.setFrom(error);
              return EMPTY;
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((result) => this.result.set(result));
  }

  protected readonly timeZone = computed(() => timeZoneLabel(this.language() as Language));

  protected offset(iso: string): string {
    return utcOffsetLabel(new Date(iso));
  }

  protected readonly searchUsers = (term: string) => this.lookup.searchUsers(term);

  protected readonly searchCondominiums = (term: string) => this.lookup.searchCondominiums(term);

  protected pickUser(option: LookupOption | null): void {
    this.page.set(0);
    this.user.set(option);
  }

  protected pickCondominium(option: LookupOption | null): void {
    this.page.set(0);
    this.condominium.set(option);
  }

  protected setFrom(value: string): void {
    this.page.set(0);
    this.from.set(value);
  }

  protected setTo(value: string): void {
    this.page.set(0);
    this.to.set(value);
  }

  protected toggleFilters(): void {
    this.filtersOpen.update((open) => !open);
  }

  protected selectEntityType(type: AuditEntityType | null): void {
    this.page.set(0);
    this.entityType.set(type);
  }

  protected selectAction(action: AuditAction | null): void {
    this.page.set(0);
    this.action.set(action);
  }

  protected changeSize(size: number): void {
    this.size.set(size);
    this.page.set(0);
  }

  protected goTo(page: number): void {
    this.page.set(page);
  }

  protected toggle(id: string): void {
    this.expanded.update((current) => (current === id ? null : id));
  }

  protected changes(log: AuditLog) {
    return diffAudit(log.oldData, log.newData);
  }

  private initialOption(key: 'userId' | 'condominiumId'): LookupOption | null {
    const id = this.query.get(key);
    return id ? { id, label: id.slice(0, 8) } : null;
  }

  private resolveLabels(): void {
    const user = this.user();
    const condominium = this.condominium();
    if (user) this.fill(this.user, this.lookup.user(user.id));
    if (condominium) this.fill(this.condominium, this.lookup.condominium(condominium.id));
  }

  private fill(
    target: WritableSignal<LookupOption | null>,
    lookup: Observable<LookupOption>,
  ): void {
    lookup
      .pipe(
        catchError(() => EMPTY),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((option) => target.set(option));
  }
}

function startOfDay(date: string): string {
  return new Date(`${date}T00:00:00`).toISOString();
}

function endOfDay(date: string): string {
  return new Date(`${date}T23:59:59.999`).toISOString();
}
