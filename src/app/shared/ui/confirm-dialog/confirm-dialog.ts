import { TranslocoPipe } from '@jsverse/transloco';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { Button } from '../button/button';
import { TextField } from '../text-field/text-field';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel: string;
  params?: Record<string, string>;
  danger?: boolean;
  reason?: { label: string; maxLength: number };
}

export type ConfirmResult = boolean | string;

@Component({
  selector: 'app-confirm-dialog',
  imports: [TranslocoPipe, Button, TextField],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialog {
  protected readonly data = inject<ConfirmDialogData>(DIALOG_DATA);
  private readonly ref = inject<DialogRef<ConfirmResult>>(DialogRef);
  protected readonly reason = inject(NonNullableFormBuilder).control('', [
    Validators.required,
    (control) => (control.value.trim() ? null : { required: true }),
  ]);

  protected cancel(): void {
    this.ref.close(false);
  }

  protected confirm(): void {
    if (!this.data.reason) return this.ref.close(true);
    if (this.reason.invalid) return this.reason.markAsTouched();
    this.ref.close(this.reason.value.trim());
  }
}
