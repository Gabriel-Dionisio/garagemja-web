import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { ErrorText } from '../../../core/i18n/error-text';
import { Alert } from '../../ui/alert/alert';
import { Button } from '../../ui/button/button';
import { ChipGroup, ChipOption } from '../../ui/chip-group/chip-group';
import { FormActions } from '../../ui/form-actions/form-actions';
import { TextField } from '../../ui/text-field/text-field';
import { REVIEW_COMMENT_MAX } from '../review-dialog/review-dialog';
import { REPORT_REASONS, ReportReason } from '../review.model';
import { ReviewsApi } from '../reviews-api';

export interface ReportDialogData {
  reviewId: string;
}

@Component({
  selector: 'app-report-dialog',
  imports: [TranslocoPipe, FormsModule, Alert, Button, ChipGroup, FormActions, TextField],
  templateUrl: './report-dialog.html',
  styleUrl: '../review-dialog/review-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportDialog {
  private readonly data = inject<ReportDialogData>(DIALOG_DATA);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ref = inject<DialogRef<boolean>>(DialogRef);
  private readonly api = inject(ReviewsApi);

  protected readonly options: readonly ChipOption<ReportReason>[] = REPORT_REASONS.map((value) => ({
    value,
    labelKey: `reviews.reason.${value}`,
  }));
  protected readonly detailsMax = REVIEW_COMMENT_MAX;
  protected readonly reason = signal<ReportReason | null>(null);
  protected readonly details = new FormControl('', { nonNullable: true });
  protected readonly submitting = signal(false);
  protected readonly error = inject(ErrorText).state({
    404: 'reviews.errors.notFound',
    409: 'reviews.errors.reported',
  });

  protected close(): void {
    this.ref.close(false);
  }

  protected submit(): void {
    const reason = this.reason();
    if (this.submitting() || !reason) return;
    this.submitting.set(true);
    this.error.clear();
    this.api
      .report(this.data.reviewId, reason, this.details.value.trim())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.ref.close(true),
        error: (error: unknown) => {
          this.submitting.set(false);
          this.error.setFrom(error);
        },
      });
  }
}
