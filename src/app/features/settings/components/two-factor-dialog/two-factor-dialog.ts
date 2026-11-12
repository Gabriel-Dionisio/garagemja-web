import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { Observable, finalize } from 'rxjs';
import { ErrorText } from '../../../../core/i18n/error-text';
import { Alert } from '../../../../shared/ui/alert/alert';
import { Button } from '../../../../shared/ui/button/button';
import { TextField } from '../../../../shared/ui/text-field/text-field';
import { SecurityApi } from '../../data/security-api';
import { TotpSetup } from '../../security.model';

export type TwoFactorMode = 'enable' | 'disable' | 'regenerate';

@Component({
  selector: 'app-two-factor-dialog',
  imports: [TranslocoPipe, ReactiveFormsModule, Alert, Button, TextField],
  templateUrl: './two-factor-dialog.html',
  styleUrl: './two-factor-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TwoFactorDialog {
  protected readonly mode = inject<{ mode: TwoFactorMode }>(DIALOG_DATA).mode;
  private readonly ref = inject<DialogRef<boolean>>(DialogRef);
  private readonly api = inject(SecurityApi);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly error = inject(ErrorText).state();
  protected readonly codeForm = inject(NonNullableFormBuilder).group({
    code: ['', [Validators.required, Validators.maxLength(16)]],
  });
  protected readonly code = this.codeForm.controls.code;
  protected readonly setup = signal<TotpSetup | null>(null);
  protected readonly qr = signal<string | null>(null);
  protected readonly recoveryCodes = signal<string[] | null>(null);
  protected readonly busy = signal(false);
  protected readonly copied = signal(false);
  private changed = false;

  constructor() {
    if (this.mode === 'enable') this.startSetup();
  }

  protected submit(): void {
    if (this.code.invalid) {
      this.code.markAsTouched();
      return;
    }
    const code = this.code.value.trim();
    if (this.mode === 'disable') this.run(this.api.disable(code), () => this.ref.close(true));
    else {
      const request =
        this.mode === 'enable' ? this.api.confirm(code) : this.api.regenerateRecoveryCodes(code);
      this.run(request, (codes) => {
        this.changed = true;
        this.recoveryCodes.set(codes);
      });
    }
  }

  protected copy(): void {
    navigator.clipboard
      .writeText(this.recoveryCodes()?.join('\n') ?? '')
      .then(() => this.copied.set(true))
      .catch(() => this.copied.set(false));
  }

  protected close(): void {
    this.ref.close(this.changed);
  }

  private startSetup(): void {
    this.api
      .setup()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (setup) => {
          this.setup.set(setup);
          import('qrcode')
            .then(({ toDataURL }) => toDataURL(setup.otpauthUri, { margin: 1, width: 192 }))
            .then((url) => this.qr.set(url))
            .catch(() => undefined);
        },
        error: (error: unknown) => this.error.setFrom(error),
      });
  }

  private run<T>(request: Observable<T>, done: (value: T) => void): void {
    this.busy.set(true);
    this.error.clear();
    request
      .pipe(
        finalize(() => this.busy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({ next: done, error: (error: unknown) => this.error.setFrom(error) });
  }
}
