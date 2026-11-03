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
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth-service';
import { ErrorText } from '../../../../core/i18n/error-text';
import { isAccountType } from '../../../../core/auth/role';
import { setServerErrors } from '../../../../shared/forms/field-errors';
import { focusFirstInvalid } from '../../../../shared/forms/focus-first-invalid';
import {
  formatCpf,
  formatEmailInput,
  formatNameInput,
  formatPhone,
  onlyDigits,
} from '../../../../shared/forms/masks';
import {
  formatPersonName,
  personNameValidator,
  phoneValidator,
  sameAs,
} from '../../../../shared/forms/validators';
import { cpfValidator } from '../../../../shared/forms/cpf';
import { passwordPolicyValidator } from '../../../../shared/forms/password-policy';
import { toApiError } from '../../../../shared/models/api-error.mapper';
import { AuthPanel } from '../../../../shared/ui/auth-panel/auth-panel';
import { Alert } from '../../../../shared/ui/alert/alert';
import { Button } from '../../../../shared/ui/button/button';
import { PasswordField } from '../../../../shared/ui/password-field/password-field';
import { SelectField, SelectOption } from '../../../../shared/ui/select-field/select-field';
import { TextField } from '../../../../shared/ui/text-field/text-field';
import { PendingVerificationStore } from '../../pending-verification';

@Component({
  selector: 'app-register-page',
  imports: [
    AutofocusFirst,
    TranslocoPipe,
    ReactiveFormsModule,
    RouterLink,
    Alert,
    AuthPanel,
    Button,
    PasswordField,
    SelectField,
    TextField,
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

  protected readonly accountTypes: SelectOption[] = [
    { value: 'RESIDENT', label: 'common.roles.RESIDENT' },
    { value: 'CONDOMINIUM_ADMIN', label: 'auth.register.roleAdminPending' },
  ];
  protected readonly formatCpf = formatCpf;
  protected readonly formatEmail = formatEmailInput;
  protected readonly formatName = formatNameInput;
  protected readonly formatPhone = formatPhone;
  protected readonly form = inject(NonNullableFormBuilder).group({
    name: ['', [Validators.required, Validators.maxLength(150), personNameValidator]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, phoneValidator]],
    cpf: ['', [Validators.required, cpfValidator]],
    accountType: 'RESIDENT',
    password: ['', [Validators.required, passwordPolicyValidator]],
    confirmPassword: ['', [Validators.required, sameAs('password')]],
  });
  protected readonly submitting = signal(false);
  protected readonly error = this.errorText.state();

  constructor() {
    const email = inject(ActivatedRoute).snapshot.queryParamMap.get('email');
    if (email) this.form.controls.email.setValue(email);
    this.form.controls.password.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.form.controls.confirmPassword.updateValueAndValidity());
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsDirty();
      this.form.markAllAsTouched();
      focusFirstInvalid(this.host.nativeElement);
      return;
    }
    const { name, email, phone, cpf, accountType, password } = this.form.getRawValue();
    if (!isAccountType(accountType)) return;
    this.submitting.set(true);
    this.error.clear();
    this.auth
      .register({
        name: formatPersonName(name),
        email: email.trim(),
        password,
        phone: onlyDigits(phone),
        cpf: onlyDigits(cpf),
        accountTypes: [accountType],
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.pendingVerification.hold({ email: email.trim(), password });
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
