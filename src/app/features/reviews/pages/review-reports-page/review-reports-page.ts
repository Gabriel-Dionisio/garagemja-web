import { Dialog } from '@angular/cdk/dialog';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { EMPTY, catchError, switchMap, tap } from 'rxjs';
import { ErrorText } from '../../../../core/i18n/error-text';
import { LocaleService } from '../../../../core/i18n/locale-service';
import { dateTimeFormatter } from '../../../../shared/forms/format';
import { Page as ResultPage } from '../../../../shared/models/page';
import {
  REPORT_STATUSES,
  ReportStatus,
  ReviewDecision,
  ReviewReportItem,
} from '../../../../shared/reviews/review.model';
import { ReviewsApi } from '../../../../shared/reviews/reviews-api';
import { Alert } from '../../../../shared/ui/alert/alert';
import { Badge, BadgeTone } from '../../../../shared/ui/badge/badge';
import { Button } from '../../../../shared/ui/button/button';
import { ChipGroup, ChipOption } from '../../../../shared/ui/chip-group/chip-group';
import { ListItem } from '../../../../shared/ui/list-item/list-item';
import { ListState } from '../../../../shared/ui/list-state/list-state';
import { Page } from '../../../../shared/ui/page/page';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZES,
  Paginator,
} from '../../../../shared/ui/paginator/paginator';
import { ResolveDialog, ResolveDialogData } from '../../components/resolve-dialog/resolve-dialog';

const TONES: Record<ReportStatus, BadgeTone> = {
  OPEN: 'warning',
  KEPT: 'success',
  HIDDEN: 'neutral',
};

@Component({
  selector: 'app-review-reports-page',
  imports: [
    TranslocoPipe,
    Alert,
    Badge,
    Button,
    ChipGroup,
    ListItem,
    ListState,
    Page,
    PageHeader,
    Paginator,
  ],
  templateUrl: './review-reports-page.html',
  styleUrl: './review-reports-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewReportsPage {
  private readonly api = inject(ReviewsApi);
  private readonly dialog = inject(Dialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly locale = inject(LocaleService);
  private readonly transloco = inject(TranslocoService);

  protected readonly tones = TONES;
  protected readonly dateTime = computed(() => dateTimeFormatter(this.locale.language()));
  protected readonly pageSizes = PAGE_SIZES;
  protected readonly filters: readonly ChipOption<ReportStatus>[] = [
    { value: null, labelKey: 'reviews.admin.all' },
    ...REPORT_STATUSES.map((value) => ({ value, labelKey: `reviews.admin.status.${value}` })),
  ];
  protected readonly error = inject(ErrorText).state();
  protected readonly status = signal<ReportStatus | null>('OPEN');
  protected readonly page = signal(0);
  protected readonly size = signal(DEFAULT_PAGE_SIZE);
  protected readonly loading = signal(true);
  protected readonly result = signal<ResultPage<ReviewReportItem> | null>(null);
  protected readonly empty = computed(() => this.result()?.items.length === 0);
  private readonly reload = signal(0);
  private readonly request = computed(() => ({
    reload: this.reload(),
    page: this.page(),
    size: this.size(),
    status: this.status(),
  }));

  constructor() {
    toObservable(this.request)
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.clear();
        }),
        switchMap(({ page, size, status }) =>
          this.api.reports(status, page, size).pipe(
            catchError((error: unknown) => {
              this.error.setFrom(error);
              this.result.set(null);
              this.loading.set(false);
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((result) => {
        this.result.set(result);
        this.loading.set(false);
      });
  }

  protected filter(status: ReportStatus | null): void {
    this.status.set(status);
    this.page.set(0);
  }

  protected resolve(report: ReviewReportItem, decision: ReviewDecision): void {
    const data: ResolveDialogData = { reportId: report.id, decision };
    this.dialog
      .open<boolean>(ResolveDialog, { data, ariaLabelledBy: 'resolve-title' })
      .closed.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((done) => {
        if (done) this.reload.update((value) => value + 1);
      });
  }

  protected changeSize(size: number): void {
    this.size.set(size);
    this.page.set(0);
  }

  protected goTo(page: number): void {
    this.page.set(page);
  }

  protected context(report: ReviewReportItem): string {
    const reported = this.transloco.translate('reviews.admin.reportedAt', {
      date: this.dateTime()(report.createdAt),
    });
    if (!report.parkingSpotNumber || !report.condominiumName) return reported;
    const spot = this.transloco.translate('reviews.admin.spot', {
      number: report.parkingSpotNumber,
      condominium: report.condominiumName,
    });
    return `${spot} · ${reported}`;
  }

  protected notes(report: ReviewReportItem): string {
    const parts: [string, string | null | undefined][] = [
      ['comment', report.reviewComment],
      ['details', report.details],
      ['note', report.resolutionNote],
    ];
    return parts
      .filter(([, text]) => text)
      .map(([key, text]) => this.transloco.translate(`reviews.admin.${key}`, { text }))
      .join(' · ');
  }
}
