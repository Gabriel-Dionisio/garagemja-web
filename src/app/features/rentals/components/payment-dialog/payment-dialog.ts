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
import { EMPTY, Subscription, catchError, switchMap, takeWhile, timer } from 'rxjs';
import { ErrorText } from '../../../../core/i18n/error-text';
import { LocaleService } from '../../../../core/i18n/locale-service';
import { moneyFormatter } from '../../../../shared/forms/format';
import { Alert } from '../../../../shared/ui/alert/alert';
import { Button } from '../../../../shared/ui/button/button';
import { ChipGroup, ChipOption } from '../../../../shared/ui/chip-group/chip-group';
import { FormActions } from '../../../../shared/ui/form-actions/form-actions';
import { TextField } from '../../../../shared/ui/text-field/text-field';
import { PaymentsApi } from '../../data/payments-api';
import { Payment, PaymentMethod } from '../../payment.model';
import { Rental } from '../../../../shared/rentals/rental.model';

export interface PaymentDialogData {
  rental: Rental;
}

const POLL_MS = 3000;
const digits = (value: string) => value.replace(/\D/g, '').slice(0, 4);

@Component({
  selector: 'app-payment-dialog',
  imports: [TranslocoPipe, ReactiveFormsModule, Alert, Button, ChipGroup, FormActions, TextField],
  templateUrl: './payment-dialog.html',
  styleUrl: './payment-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentDialog {
  private readonly destroyRef = inject(DestroyRef);
  protected readonly data = inject<PaymentDialogData>(DIALOG_DATA);
  private readonly ref = inject<DialogRef<boolean>>(DialogRef);
  private readonly api = inject(PaymentsApi);
  private readonly locale = inject(LocaleService);
  private polling: Subscription | null = null;

  protected readonly money = computed(() => moneyFormatter(this.locale.language()));
  protected readonly methods: readonly ChipOption<PaymentMethod>[] = [
    { value: 'PIX', labelKey: 'rentals.payment.pix' },
    { value: 'CARD', labelKey: 'rentals.payment.card' },
  ];
  protected readonly format = digits;
  protected readonly method = signal<PaymentMethod>('PIX');
  protected readonly payment = signal<Payment | null>(null);
  protected readonly submitting = signal(false);
  protected readonly copied = signal(false);
  protected readonly declined = signal(false);
  protected readonly canceling = signal(false);
  protected readonly cardLast4 = inject(NonNullableFormBuilder).control('', [
    Validators.required,
    Validators.pattern(/^\d{4}$/),
  ]);
  protected readonly error = inject(ErrorText).state({
    400: 'rentals.payment.invalid',
    409: 'rentals.payment.conflict',
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.polling?.unsubscribe());
    if (this.data.rental.paymentPending) {
      this.api
        .pendingOf(this.data.rental.id)
        .pipe(takeUntilDestroyed())
        .subscribe({
          next: (pending) => {
            if (pending) this.track(pending);
          },
          error: (error: unknown) => this.error.setFrom(error),
        });
    }
  }

  protected close(): void {
    this.ref.close(false);
  }

  protected submit(): void {
    if (this.submitting()) return;
    const card = this.method() === 'CARD';
    if (card && this.cardLast4.invalid) return this.cardLast4.markAsTouched();
    this.submitting.set(true);
    this.error.clear();
    this.declined.set(false);
    this.api
      .create({
        rentalId: this.data.rental.id,
        method: this.method(),
        cardLast4: card ? this.cardLast4.value : null,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (created) => {
          this.submitting.set(false);
          this.track(created);
        },
        error: (error: unknown) => {
          this.submitting.set(false);
          this.error.setFrom(error);
        },
      });
  }

  protected cancelPix(): void {
    const current = this.payment();
    if (!current || this.canceling()) return;
    this.canceling.set(true);
    this.polling?.unsubscribe();
    this.api
      .cancel(current.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.canceling.set(false);
          this.payment.set(null);
        },
        error: (error: unknown) => {
          this.canceling.set(false);
          this.error.setFrom(error);
          this.track(current);
        },
      });
  }

  protected copy(code: string): void {
    navigator.clipboard
      ?.writeText(code)
      .then(() => this.copied.set(true))
      .catch(() => undefined);
  }

  private track(payment: Payment): void {
    if (payment.status === 'PAID') return this.ref.close(true);
    if (payment.status === 'FAILED') {
      this.declined.set(true);
      return;
    }
    this.payment.set(payment);
    this.polling?.unsubscribe();
    this.polling = timer(POLL_MS, POLL_MS)
      .pipe(
        switchMap(() => this.api.get(payment.id).pipe(catchError(() => EMPTY))),
        takeWhile((current) => current.status === 'PENDING', true),
      )
      .subscribe({
        next: (current) => {
          if (current.status === 'PAID') this.ref.close(true);
          else if (current.status !== 'PENDING') {
            this.declined.set(current.status === 'FAILED');
            this.payment.set(null);
          }
        },
        error: (error: unknown) => this.error.setFrom(error),
      });
  }
}
