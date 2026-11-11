import { TranslocoPipe } from '@jsverse/transloco';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnDestroy,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth-service';
import { ErrorText } from '../../../../core/i18n/error-text';
import { Alert } from '../../../../shared/ui/alert/alert';
import { AuthPanel } from '../../../../shared/ui/auth-panel/auth-panel';
import { Button } from '../../../../shared/ui/button/button';
import { Icon } from '../../../../shared/ui/icon/icon';
import { PendingVerification, PendingVerificationStore } from '../../pending-verification';

@Component({
  selector: 'app-verify-email-page',
  imports: [TranslocoPipe, RouterLink, Alert, AuthPanel, Button, Icon],
  templateUrl: './verify-email-page.html',
  styleUrl: './verify-email-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyEmailPage implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly errorText = inject(ErrorText);
  private pending: PendingVerification | null = inject(PendingVerificationStore).take();

  protected readonly email = this.pending?.email ?? '';
  protected readonly canResend = this.pending !== null;
  protected readonly loginParams = this.pending?.returnUrl
    ? { returnUrl: this.pending.returnUrl }
    : null;
  protected readonly submitting = signal(false);
  protected readonly resent = signal(false);
  protected readonly error = this.errorText.state();

  ngOnDestroy(): void {
    this.pending = null;
  }

  protected resend(): void {
    if (!this.pending) return;
    this.submitting.set(true);
    this.error.clear();
    this.auth
      .resendVerification(this.pending)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.resent.set(true);
        },
        error: (error: unknown) => {
          this.submitting.set(false);
          this.error.setFrom(error);
        },
      });
  }
}
