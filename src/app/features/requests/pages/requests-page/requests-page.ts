import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { EMPTY, catchError, finalize, switchMap, tap } from 'rxjs';
import { ErrorText } from '../../../../core/i18n/error-text';
import { Page as ResultPage } from '../../../../shared/models/page';
import { Alert } from '../../../../shared/ui/alert/alert';
import { Badge, BadgeTone } from '../../../../shared/ui/badge/badge';
import { Button } from '../../../../shared/ui/button/button';
import { ConfirmService } from '../../../../shared/ui/confirm-dialog/confirm-service';
import { Icon } from '../../../../shared/ui/icon/icon';
import { ListItem } from '../../../../shared/ui/list-item/list-item';
import { ListState } from '../../../../shared/ui/list-state/list-state';
import { Page } from '../../../../shared/ui/page/page';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZES,
  Paginator,
} from '../../../../shared/ui/paginator/paginator';
import { TabLink, TabNav } from '../../../../shared/ui/tab-nav/tab-nav';
import { OwnedRental } from '../../../dashboard/owned-rental.model';
import { RequestsApi } from '../../data/requests-api';
import { REQUEST_TABS, RequestDecision, RequestStatus } from '../../request.model';

const STATUS_TONES: Record<RequestStatus, BadgeTone> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REFUSED: 'danger',
};

@Component({
  selector: 'app-requests-page',
  imports: [
    DecimalPipe,
    TranslocoPipe,
    Alert,
    Badge,
    Button,
    Icon,
    ListItem,
    ListState,
    Page,
    PageHeader,
    Paginator,
    TabNav,
  ],
  templateUrl: './requests-page.html',
  styleUrl: './requests-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestsPage {
  private readonly api = inject(RequestsApi);
  private readonly confirm = inject(ConfirmService);
  protected readonly transloco = inject(TranslocoService);

  readonly status = input.required<RequestStatus>();

  protected readonly tones = STATUS_TONES;
  protected readonly pageSizes = PAGE_SIZES;
  protected readonly error = inject(ErrorText).state();
  protected readonly page = signal(0);
  protected readonly size = signal(DEFAULT_PAGE_SIZE);
  protected readonly loading = signal(true);
  protected readonly result = signal<ResultPage<OwnedRental> | null>(null);
  protected readonly failed = signal(false);
  protected readonly deciding = signal<string | null>(null);
  protected readonly empty = computed(() => this.result()?.items.length === 0);
  protected readonly tabs = computed<TabLink[]>(() =>
    REQUEST_TABS.map((tab) => ({
      link: ['/requests', tab.path],
      label: this.transloco.translate(tab.labelKey),
    })),
  );
  private readonly reloads = signal(0);
  private readonly request = computed(() => ({
    status: this.status(),
    page: this.page(),
    size: this.size(),
    reload: this.reloads(),
  }));

  constructor() {
    toObservable(this.status)
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.page.set(0);
        this.result.set(null);
      });

    toObservable(this.request)
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.failed.set(false);
        }),
        switchMap(({ status, page, size }) =>
          this.api.list(page, size, status).pipe(
            catchError((error: unknown) => {
              this.error.setFrom(error);
              this.failed.set(true);
              this.result.set(null);
              this.loading.set(false);
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((result) => {
        this.error.clear();
        this.result.set(result);
        this.loading.set(false);
      });
  }

  protected reload(): void {
    this.error.clear();
    this.reloads.update((count) => count + 1);
  }

  protected decide(rental: OwnedRental, decision: RequestDecision): void {
    if (this.deciding()) return;
    const key = decision === 'APPROVED' ? 'approve' : 'refuse';
    this.deciding.set(rental.id);
    this.error.clear();
    this.confirm
      .confirm({
        title: `requests.dialog.${key}.title`,
        message: `requests.dialog.${key}.message`,
        params: { spot: rental.parkingSpotNumber },
        confirmLabel: `requests.dialog.${key}.confirm`,
        danger: decision === 'REFUSED',
      })
      .pipe(
        switchMap((ok) => (ok ? this.api.decide(rental.id, decision) : EMPTY)),
        finalize(() => this.deciding.set(null)),
      )
      .subscribe({
        next: () => this.reload(),
        error: (error: unknown) => this.error.setFrom(error),
      });
  }

  protected changeSize(size: number): void {
    this.size.set(size);
    this.page.set(0);
  }

  protected goTo(page: number): void {
    this.page.set(page);
  }
}
