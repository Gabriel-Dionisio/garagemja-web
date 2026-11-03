import { AutofocusFirst } from '../../../../shared/forms/autofocus-first';
import { TranslocoPipe } from '@jsverse/transloco';
import { ErrorText } from '../../../../core/i18n/error-text';
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
import { Router } from '@angular/router';
import { Role } from '../../../../core/auth/auth.model';
import { ROLES } from '../../../../core/auth/role';
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
} from '../../../../shared/forms/validators';
import { cpfValidator } from '../../../../shared/forms/cpf';
import { passwordPolicyValidator } from '../../../../shared/forms/password-policy';
import { toApiError } from '../../../../shared/models/api-error.mapper';
import { Alert } from '../../../../shared/ui/alert/alert';
import { Button } from '../../../../shared/ui/button/button';
import { Card } from '../../../../shared/ui/card/card';
import { FormActions } from '../../../../shared/ui/form-actions/form-actions';
import { FormSection } from '../../../../shared/ui/form-section/form-section';
import { RolePicker } from '../../components/role-picker/role-picker';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { PasswordField } from '../../../../shared/ui/password-field/password-field';
import { TextField } from '../../../../shared/ui/text-field/text-field';
import { UsersApi } from '../../data/users-api';

@Component({
  selector: 'app-user-form-page',
  imports: [
    AutofocusFirst,
    TranslocoPipe,
    ReactiveFormsModule,
    Alert,
    Button,
    Card,
    FormActions,
    FormSection,
    RolePicker,
    PageHeader,
    PasswordField,
    TextField,
  ],
  templateUrl: './user-form-page.html',
  styleUrl: './user-form-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserFormPage {
  private readonly errorText = inject(ErrorText);
  private readonly api = inject(UsersApi);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly formatCpf = formatCpf;
  protected readonly formatEmail = formatEmailInput;
  protected readonly formatName = formatNameInput;
  protected readonly formatPhone = formatPhone;
  protected readonly submitting = signal(false);
  protected readonly error = this.errorText.state();
  protected readonly rolesMissing = signal(false);
  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(150), personNameValidator]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, phoneValidator]],
    cpf: ['', [Validators.required, cpfValidator]],
    roles: this.fb.group({ ADMIN: false, CONDOMINIUM_ADMIN: false, RESIDENT: true }),
    password: ['', [Validators.required, passwordPolicyValidator]],
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsDirty();
      this.form.markAllAsTouched();
      focusFirstInvalid(this.host.nativeElement);
      return;
    }
    const { name, email, phone, cpf, roles, password } = this.form.getRawValue();
    const selected = ROLES.filter((role) => roles[role]);
    if (selected.length === 0) {
      this.rolesMissing.set(true);
      return;
    }
    this.submitting.set(true);
    this.error.clear();
    this.api
      .create({
        name: formatPersonName(name),
        email: email.trim(),
        password,
        phone: onlyDigits(phone),
        cpf: onlyDigits(cpf),
        roles: selected,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => void this.router.navigate(['/admin/users', user.id]),
        error: (error: unknown) => {
          const apiError = toApiError(error);
          this.submitting.set(false);
          if (setServerErrors(this.form.controls, apiError.fieldErrors))
            focusFirstInvalid(this.host.nativeElement);
          else this.error.set(apiError);
        },
      });
  }
}
