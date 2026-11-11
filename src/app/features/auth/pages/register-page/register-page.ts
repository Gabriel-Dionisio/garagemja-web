import { AutofocusFirst } from '../../../../shared/forms/autofocus-first';
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
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth-service';
import { ErrorText } from '../../../../core/i18n/error-text';
import { formatEmailInput } from '../../../../shared/forms/masks';
import { setServerErrors } from '../../../../shared/forms/field-errors';
import { focusFirstInvalid } from '../../../../shared/forms/focus-first-invalid';
import { toApiError } from '../../../../shared/models/api-error.mapper';
import { AuthPanel } from '../../../../shared/ui/auth-panel/auth-panel';
import { Alert } from '../../../../shared/ui/alert/alert';
import { Button } from '../../../../shared/ui/button/button';
import { AccountFields } from '../../components/account-fields/account-fields';
import { accountValue, createAccountForm } from '../../components/account-form';
import { PendingVerificationStore } from '../../pending-verification';

const EMAIL_MAX_LENGTH = 180;

function isValidEmail(value: string): boolean {
  return (
    value.length > 0 &&
    value.length <= EMAIL_MAX_LENGTH &&
    !new FormControl(value, Validators.email).errors
  );
}

@Component({
  selector: 'app-register-page',
  imports: [
    AutofocusFirst,
    TranslocoPipe,
    ReactiveFormsModule,
    RouterLink,
    Alert,
    AccountFields,
    AuthPanel,
    Button,
  ],
  templateUrl: './register-page.html',
  styleUrl: './register-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPage {
  private readonly auth = inject(AuthService);
  private readonly errorText = inject(ErrorText);
  private readonly router = inject(Router);
  private readonly pendingVerification = inject(PendingVerificationStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly query = inject(ActivatedRoute).snapshot.queryParamMap;
  private readonly returnUrl = this.query.get('returnUrl');

  protected readonly form = createAccountForm();
  protected readonly returnParams = this.returnUrl ? { returnUrl: this.returnUrl } : {};
  protected readonly submitting = signal(false);
  protected readonly error = this.errorText.state();

  constructor() {
    const email = formatEmailInput(this.query.get('email') ?? '');
    if (isValidEmail(email)) this.form.controls.email.setValue(email);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsDirty();
      this.form.markAllAsTouched();
      focusFirstInvalid(this.host.nativeElement);
      return;
    }
    const account = accountValue(this.form);
    this.submitting.set(true);
    this.error.clear();
    this.auth
      .register({ ...account, accountTypes: ['RESIDENT'] })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.pendingVerification.hold({
            email: account.email,
            password: account.password,
            ...(this.returnUrl && { returnUrl: this.returnUrl }),
          });
          void this.router.navigateByUrl('/verify-email');
        },
        error: (error: unknown) => {
          const apiError = toApiError(error);
          this.submitting.set(false);
          const mapped = setServerErrors(this.form.controls, apiError.fieldErrors);
          if (mapped) focusFirstInvalid(this.host.nativeElement);
          else this.error.set(apiError);
        },
      });
  }
}
