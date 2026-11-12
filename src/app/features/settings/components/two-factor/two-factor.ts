import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoPipe } from '@jsverse/transloco';
import { ErrorText } from '../../../../core/i18n/error-text';
import { Alert } from '../../../../shared/ui/alert/alert';
import { Button } from '../../../../shared/ui/button/button';
import { SettingRow } from '../../../../shared/ui/setting-row/setting-row';
import { SecurityApi } from '../../data/security-api';
import { TotpStatus } from '../../security.model';
import { TwoFactorDialog, TwoFactorMode } from '../two-factor-dialog/two-factor-dialog';

@Component({
  selector: 'app-two-factor',
  imports: [TranslocoPipe, Alert, Button, SettingRow],
  templateUrl: './two-factor.html',
  styleUrl: './two-factor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TwoFactor {
  private readonly api = inject(SecurityApi);
  private readonly dialog = inject(Dialog);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly error = inject(ErrorText).state();
  protected readonly status = signal<TotpStatus | null>(null);

  constructor() {
    this.load();
  }

  protected open(mode: TwoFactorMode): void {
    this.dialog
      .open<boolean>(TwoFactorDialog, {
        data: { mode },
        ariaLabelledBy: 'two-factor-title',
        disableClose: false,
      })
      .closed.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.load());
  }

  protected load(): void {
    this.error.clear();
    this.api
      .status()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (status) => this.status.set(status),
        error: (error: unknown) => this.error.setFrom(error),
      });
  }
}
