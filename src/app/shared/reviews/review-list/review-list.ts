import { Dialog } from '@angular/cdk/dialog';
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
import { TranslocoPipe } from '@jsverse/transloco';
import { EMPTY, Observable, catchError, switchMap, tap } from 'rxjs';
import { ErrorText } from '../../../core/i18n/error-text';
import { LocaleService } from '../../../core/i18n/locale-service';
import { dateTimeFormatter } from '../../forms/format';
import { Page as ResultPage } from '../../models/page';
import { Alert } from '../../ui/alert/alert';
import { Button } from '../../ui/button/button';
import { ListItem } from '../../ui/list-item/list-item';
import { ListState } from '../../ui/list-state/list-state';
import { DEFAULT_PAGE_SIZE, PAGE_SIZES, Paginator } from '../../ui/paginator/paginator';
import { ReportDialog, ReportDialogData } from '../report-dialog/report-dialog';
import { Review } from '../review.model';

export type ReviewSource = (page: number, size: number) => Observable<ResultPage<Review>>;

@Component({
  selector: 'app-review-list',
  imports: [TranslocoPipe, Alert, Button, ListItem, ListState, Paginator],
  templateUrl: './review-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewList {
  readonly source = input.required<ReviewSource>();
  readonly canReport = input(false);

  private readonly dialog = inject(Dialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly locale = inject(LocaleService);

  protected readonly date = computed(() => dateTimeFormatter(this.locale.language()));
  protected readonly pageSizes = PAGE_SIZES;
  protected readonly error = inject(ErrorText).state();
  protected readonly page = signal(0);
  protected readonly size = signal(DEFAULT_PAGE_SIZE);
  protected readonly loading = signal(true);
  protected readonly result = signal<ResultPage<Review> | null>(null);
  protected readonly empty = computed(() => this.result()?.items.length === 0);
  private readonly reported = signal(new Set<string>());
  private readonly request = computed(() => ({
    source: this.source(),
    page: this.page(),
    size: this.size(),
  }));

  constructor() {
    toObservable(this.request)
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.clear();
        }),
        switchMap(({ source, page, size }) =>
          source(page, size).pipe(
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

  protected isReported(review: Review): boolean {
    return this.reported().has(review.id);
  }

  protected report(review: Review): void {
    const data: ReportDialogData = { reviewId: review.id };
    this.dialog
      .open<boolean>(ReportDialog, { data, ariaLabelledBy: 'report-title' })
      .closed.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((done) => {
        if (done) this.reported.update((ids) => new Set(ids).add(review.id));
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
