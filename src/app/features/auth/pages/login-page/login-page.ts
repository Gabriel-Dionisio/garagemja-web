import { AutofocusFirst } from '../../../../shared/forms/autofocus-first';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth-service';
import { safeReturnUrl } from '../../../../core/auth/return-url';
import { ErrorText } from '../../../../core/i18n/error-text';
import { focusFirstInvalid } from '../../../../shared/forms/focus-first-invalid';
import { formatEmailInput } from '../../../../shared/forms/masks';
import { toApiError } from '../../../../shared/models/api-error.mapper';
import { AuthPanel } from '../../../../shared/ui/auth-panel/auth-panel';
import { Alert } from '../../../../shared/ui/alert/alert';
import { Button } from '../../../../shared/ui/button/button';
import { Checkbox } from '../../../../shared/ui/checkbox/checkbox';
import { PasswordField } from '../../../../shared/ui/password-field/password-field';
import { TextField } from '../../../../shared/ui/text-field/text-field';
import { EMAIL_NOT_VERIFIED_CODE } from '../../auth-errors';
import { PendingVerificationStore } from '../../pending-verification';

@Component({
  selector: 'app-login-page',
  imports: [
    AutofocusFirst,
    TranslocoPipe,
    ReactiveFormsModule,
    RouterLink,
    Alert,
    AuthPanel,
    Button,
    Checkbox,
    PasswordField,
    TextField,
  ],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly pendingVerification = inject(PendingVerificationStore);
  private readonly route = inject(ActivatedRoute);
  private readonly errorText = inject(ErrorText);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly formatEmail = formatEmailInput;
  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.maxLength(128)]],
    rememberMe: false,
  });
  protected readonly submitting = signal(false);
  protected readonly error = this.errorText.state();
  private readonly email = toSignal(this.form.controls.email.valueChanges, { initialValue: '' });

  constructor() {
    const email = this.route.snapshot.queryParamMap.get('email');
    if (email) this.form.controls.email.setValue(email);
  }

  protected readonly registerParams = computed(() => {
    const email = this.email().trim();
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    return { ...(email && { email }), ...(returnUrl && { returnUrl }) };
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsDirty();
      this.form.markAllAsTouched();
      focusFirstInvalid(this.host.nativeElement);
      return;
    }
    this.submitting.set(true);
    this.error.clear();
    const { email, ...rest } = this.form.getRawValue();
    this.auth
      .login({ ...rest, email: email.trim() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () =>
          void this.router.navigateByUrl(
            safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl')),
          ),
        error: (error: unknown) => {
          const apiError = toApiError(error);
          if (apiError.code === EMAIL_NOT_VERIFIED_CODE) {
            const { email, password } = this.form.getRawValue();
            this.pendingVerification.hold({ email, password });
            void this.router.navigateByUrl('/verify-email');
            return;
          }
          this.submitting.set(false);
          this.error.set(apiError);
        },
      });
  }
}
