import { TranslocoPipe } from '@jsverse/transloco';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth-service';
import { ErrorText } from '../../../../core/i18n/error-text';
import { AutofocusFirst } from '../../../../shared/forms/autofocus-first';
import { focusFirstInvalid } from '../../../../shared/forms/focus-first-invalid';
import { formatEmailInput } from '../../../../shared/forms/masks';
import { Alert } from '../../../../shared/ui/alert/alert';
import { AuthPanel } from '../../../../shared/ui/auth-panel/auth-panel';
import { Button } from '../../../../shared/ui/button/button';
import { TextField } from '../../../../shared/ui/text-field/text-field';

@Component({
  selector: 'app-forgot-password-page',
  imports: [
    AutofocusFirst,
    TranslocoPipe,
    ReactiveFormsModule,
    RouterLink,
    Alert,
    AuthPanel,
    Button,
    TextField,
  ],
  templateUrl: './forgot-password-page.html',
  styleUrl: './forgot-password-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordPage {
  private readonly auth = inject(AuthService);
  private readonly errorText = inject(ErrorText);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly formatEmail = formatEmailInput;
  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
  });
  protected readonly submitting = signal(false);
  protected readonly sent = signal(false);
  protected readonly error = this.errorText.state();

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsDirty();
      this.form.markAllAsTouched();
      focusFirstInvalid(this.host.nativeElement);
      return;
    }
    this.submitting.set(true);
    this.error.clear();
    this.auth
      .forgotPassword(this.form.controls.email.value.trim())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.sent.set(true);
        },
        error: (error: unknown) => {
          this.submitting.set(false);
          this.error.setFrom(error);
        },
      });
  }
}
