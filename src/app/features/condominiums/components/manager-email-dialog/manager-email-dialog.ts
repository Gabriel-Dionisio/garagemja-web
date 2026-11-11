import { TranslocoPipe } from '@jsverse/transloco';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { formatEmailInput } from '../../../../shared/forms/masks';
import { Button } from '../../../../shared/ui/button/button';
import { TextField } from '../../../../shared/ui/text-field/text-field';

export interface ManagerEmailDialogData {
  title: string;
  hint: string;
  confirmLabel: string;
  params?: Record<string, string>;
  withReason?: boolean;
}

export interface ManagerEmailResult {
  email: string;
  reason: string;
}

@Component({
  selector: 'app-manager-email-dialog',
  imports: [TranslocoPipe, ReactiveFormsModule, Button, TextField],
  templateUrl: './manager-email-dialog.html',
  styleUrl: './manager-email-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerEmailDialog {
  protected readonly data = inject<ManagerEmailDialogData>(DIALOG_DATA);
  private readonly ref = inject<DialogRef<ManagerEmailResult>>(DialogRef);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly formatEmail = formatEmailInput;
  protected readonly email = this.fb.control('', [Validators.required, Validators.email]);
  protected readonly reason = this.fb.control('', [
    Validators.maxLength(500),
    (control) => (this.data.withReason && !control.value.trim() ? { required: true } : null),
  ]);

  protected cancel(): void {
    this.ref.close();
  }

  protected submit(): void {
    if (this.email.invalid || this.reason.invalid) {
      this.email.markAsTouched();
      this.reason.markAsTouched();
      return;
    }
    this.ref.close({ email: this.email.value.trim(), reason: this.reason.value.trim() });
  }
}
