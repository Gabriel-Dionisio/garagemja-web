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
import { ReviewsApi } from '../reviews-api';

export interface ReviewDialogData {
  rentalId: string;
  subjectKey: 'spot' | 'renter';
}

export const REVIEW_COMMENT_MAX = 500;

@Component({
  selector: 'app-review-dialog',
  imports: [TranslocoPipe, FormsModule, Alert, Button, ChipGroup, FormActions, TextField],
  templateUrl: './review-dialog.html',
  styleUrl: './review-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewDialog {
  protected readonly data = inject<ReviewDialogData>(DIALOG_DATA);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ref = inject<DialogRef<boolean>>(DialogRef);
  private readonly api = inject(ReviewsApi);

  protected readonly options: readonly ChipOption<string>[] = ['1', '2', '3', '4', '5'].map(
    (value) => ({ value, label: `${value} ★` }),
  );
  protected readonly commentMax = REVIEW_COMMENT_MAX;
  protected readonly rating = signal<string | null>(null);
  protected readonly comment = new FormControl('', { nonNullable: true });
  protected readonly submitting = signal(false);
  protected readonly error = inject(ErrorText).state({
    404: 'reviews.errors.notFound',
    409: 'reviews.errors.conflict',
  });

  protected close(): void {
    this.ref.close(false);
  }

  protected submit(): void {
    const rating = Number(this.rating());
    if (this.submitting() || !rating) return;
    this.submitting.set(true);
    this.error.clear();
    this.api
      .create(this.data.rentalId, rating, this.comment.value.trim())
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
