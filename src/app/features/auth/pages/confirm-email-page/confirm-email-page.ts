import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthService } from '../../../../core/auth/auth-service';
import { ErrorText } from '../../../../core/i18n/error-text';
import { Alert } from '../../../../shared/ui/alert/alert';
import { AuthPanel } from '../../../../shared/ui/auth-panel/auth-panel';
import { Button } from '../../../../shared/ui/button/button';
import { Icon } from '../../../../shared/ui/icon/icon';
import { Spinner } from '../../../../shared/ui/spinner/spinner';

type ConfirmState = 'confirming' | 'confirmed' | 'failed';

@Component({
  selector: 'app-confirm-email-page',
  imports: [TranslocoPipe, RouterLink, Alert, AuthPanel, Button, Icon, Spinner],
  templateUrl: './confirm-email-page.html',
  styleUrl: './confirm-email-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmEmailPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly errorText = inject(ErrorText);

  readonly oobCode = input<string>();

  protected readonly state = signal<ConfirmState>('confirming');
  protected readonly error = this.errorText.state();

  ngOnInit(): void {
    const code = this.oobCode();
    void this.router.navigate([], { queryParams: {}, replaceUrl: true });
    if (!code) {
      this.state.set('failed');
      return;
    }
    this.auth
      .confirmEmail(code)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.state.set('confirmed'),
        error: (error: unknown) => {
          this.error.setFrom(error);
          this.state.set('failed');
        },
      });
  }
}
