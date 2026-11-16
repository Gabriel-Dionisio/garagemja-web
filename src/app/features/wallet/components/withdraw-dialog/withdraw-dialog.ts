import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { ErrorText } from '../../../../core/i18n/error-text';
import { LocaleService } from '../../../../core/i18n/locale-service';
import { moneyFormatter } from '../../../../shared/forms/format';
import {
  formatMoneyInput,
  parseMoney,
  positiveMoneyValidator,
} from '../../../../shared/forms/money';
import { Alert } from '../../../../shared/ui/alert/alert';
import { Button } from '../../../../shared/ui/button/button';
import { FormActions } from '../../../../shared/ui/form-actions/form-actions';
import { TextField } from '../../../../shared/ui/text-field/text-field';
import { WalletsApi } from '../../data/wallets-api';
import { WalletSummary } from '../../wallet.model';

export interface WithdrawDialogData {
  wallet: WalletSummary;
}

const PIX_KEY_MAX = 100;
const AMOUNT_MAX_LENGTH = 11;

@Component({
  selector: 'app-withdraw-dialog',
  imports: [TranslocoPipe, ReactiveFormsModule, Alert, Button, FormActions, TextField],
  templateUrl: './withdraw-dialog.html',
  styleUrl: './withdraw-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WithdrawDialog {
  protected readonly data = inject<WithdrawDialogData>(DIALOG_DATA);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ref = inject<DialogRef<boolean>>(DialogRef);
  private readonly api = inject(WalletsApi);
  private readonly locale = inject(LocaleService);

  protected readonly money = computed(() => moneyFormatter(this.locale.language()));
  protected readonly formatAmount = formatMoneyInput;
  protected readonly pixKeyMax = PIX_KEY_MAX;
  protected readonly amountMax = AMOUNT_MAX_LENGTH;
  protected readonly submitting = signal(false);
  protected readonly form = inject(NonNullableFormBuilder).group({
    amount: ['', [Validators.required, positiveMoneyValidator]],
    pixKey: ['', [Validators.required, Validators.maxLength(PIX_KEY_MAX)]],
  });
  private readonly idempotencyKey = crypto.randomUUID();
  protected readonly error = inject(ErrorText).state({
    400: 'wallet.withdraw.invalid',
    409: 'wallet.withdraw.insufficient',
  });

  protected close(): void {
    this.ref.close(false);
  }

  protected submit(): void {
    if (this.submitting()) return;
    const amount = parseMoney(this.form.controls.amount.value);
    if (this.form.invalid || amount === null) return this.form.markAllAsTouched();
    this.submitting.set(true);
    this.error.clear();
    this.api
      .withdraw(
        {
          type: this.data.wallet.type,
          refId: this.data.wallet.refId,
          amount,
          pixKey: this.form.controls.pixKey.value.trim(),
        },
        this.idempotencyKey,
      )
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
