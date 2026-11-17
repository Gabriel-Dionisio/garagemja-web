import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, Validators } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { ErrorText } from '../../../../core/i18n/error-text';
import { ReviewDecision } from '../../../../shared/reviews/review.model';
import { ReviewsApi } from '../../../../shared/reviews/reviews-api';
import { Alert } from '../../../../shared/ui/alert/alert';
import { Button } from '../../../../shared/ui/button/button';
import { FormActions } from '../../../../shared/ui/form-actions/form-actions';
import { TextField } from '../../../../shared/ui/text-field/text-field';

export interface ResolveDialogData {
  reportId: string;
  decision: ReviewDecision;
}

const NOTE_MAX = 255;

@Component({
  selector: 'app-resolve-dialog',
  imports: [TranslocoPipe, FormsModule, Alert, Button, FormActions, TextField],
  templateUrl: './resolve-dialog.html',
  styleUrl: '../../../../shared/reviews/review-dialog/review-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResolveDialog {
  private readonly data = inject<ResolveDialogData>(DIALOG_DATA);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ref = inject<DialogRef<boolean>>(DialogRef);
  private readonly api = inject(ReviewsApi);

  protected readonly noteMax = NOTE_MAX;
  protected readonly note = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(NOTE_MAX)],
  });
  protected readonly submitting = signal(false);
  protected readonly error = inject(ErrorText).state({ 409: 'reviews.errors.resolved' });

  protected close(): void {
    this.ref.close(false);
  }

  protected submit(): void {
    const note = this.note.value.trim();
    if (this.submitting()) return;
    if (!note) return this.note.markAsTouched();
    this.submitting.set(true);
    this.error.clear();
    this.api
      .resolve(this.data.reportId, this.data.decision, note)
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
