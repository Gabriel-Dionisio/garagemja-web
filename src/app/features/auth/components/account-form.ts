import { DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { cpfValidator } from '../../../shared/forms/cpf';
import { onlyDigits } from '../../../shared/forms/masks';
import { passwordPolicyValidator } from '../../../shared/forms/password-policy';
import {
  formatPersonName,
  personNameValidator,
  phoneValidator,
  sameAs,
} from '../../../shared/forms/validators';

export function createAccountForm() {
  const form = inject(NonNullableFormBuilder).group({
    name: ['', [Validators.required, Validators.maxLength(150), personNameValidator]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, phoneValidator]],
    cpf: ['', [Validators.required, cpfValidator]],
    password: ['', [Validators.required, passwordPolicyValidator]],
    confirmPassword: ['', [Validators.required, sameAs('password')]],
  });
  form.controls.password.valueChanges
    .pipe(takeUntilDestroyed(inject(DestroyRef)))
    .subscribe(() => form.controls.confirmPassword.updateValueAndValidity());
  return form;
}

export type AccountForm = ReturnType<typeof createAccountForm>;

export function accountValue(form: AccountForm) {
  const { name, email, phone, cpf, password } = form.getRawValue();
  return {
    name: formatPersonName(name),
    email: email.trim(),
    password,
    phone: onlyDigits(phone),
    cpf: onlyDigits(cpf),
  };
}
