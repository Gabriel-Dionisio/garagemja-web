import { TranslocoPipe } from '@jsverse/transloco';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth-service';
import { ErrorText } from '../../../../core/i18n/error-text';
import { AutofocusFirst } from '../../../../shared/forms/autofocus-first';
import { focusFirstInvalid } from '../../../../shared/forms/focus-first-invalid';
import { passwordPolicyValidator } from '../../../../shared/forms/password-policy';
import { sameAs } from '../../../../shared/forms/validators';
import { Alert } from '../../../../shared/ui/alert/alert';
import { AuthPanel } from '../../../../shared/ui/auth-panel/auth-panel';
import { Button } from '../../../../shared/ui/button/button';
import { PasswordField } from '../../../../shared/ui/password-field/password-field';

@Component({
  selector: 'app-reset-password-page',
  imports: [
    AutofocusFirst,
    TranslocoPipe,
    ReactiveFormsModule,
    RouterLink,
    Alert,
    AuthPanel,
    Button,
    PasswordField,
  ],
  templateUrl: './reset-password-page.html',
  styleUrl: './reset-password-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly errorText = inject(ErrorText);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private code: string | undefined;

  readonly oobCode = input<string>();

  protected readonly form = inject(NonNullableFormBuilder).group({
    password: ['', [Validators.required, passwordPolicyValidator]],
    confirmPassword: ['', [Validators.required, sameAs('password')]],
  });
  protected readonly submitting = signal(false);
  protected readonly done = signal(false);
  protected readonly linkMissing = signal(false);
  protected readonly error = this.errorText.state();

  ngOnInit(): void {
    this.code = this.oobCode();
    this.linkMissing.set(!this.code);
    void this.router.navigate([], { queryParams: {}, replaceUrl: true });
    this.form.controls.password.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.form.controls.confirmPassword.updateValueAndValidity());
  }

  protected submit(): void {
    if (this.form.invalid || !this.code) {
      this.form.markAllAsDirty();
      this.form.markAllAsTouched();
      focusFirstInvalid(this.host.nativeElement);
      return;
    }
    this.submitting.set(true);
    this.error.clear();
    this.auth
      .resetPassword(this.code, this.form.controls.password.value)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.done.set(true);
        },
        error: (error: unknown) => {
          this.submitting.set(false);
          this.error.setFrom(error);
        },
      });
  }
}
