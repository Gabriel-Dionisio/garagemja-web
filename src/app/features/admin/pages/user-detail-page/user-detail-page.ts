import { TranslocoPipe } from '@jsverse/transloco';
import { AuthService } from '../../../../core/auth/auth-service';
import { ErrorText } from '../../../../core/i18n/error-text';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { EMPTY, catchError, finalize, switchMap } from 'rxjs';
import { setServerErrors } from '../../../../shared/forms/field-errors';
import { focusFirstInvalid } from '../../../../shared/forms/focus-first-invalid';
import { formatNameInput, formatPhone, onlyDigits } from '../../../../shared/forms/masks';
import {
  formatPersonName,
  personNameValidator,
  phoneValidator,
} from '../../../../shared/forms/validators';
import { toApiError } from '../../../../shared/models/api-error.mapper';
import { Alert } from '../../../../shared/ui/alert/alert';
import { Button } from '../../../../shared/ui/button/button';
import { Card } from '../../../../shared/ui/card/card';
import { ActionItem } from '../../../../shared/ui/action-list/action-item';
import { ActionList } from '../../../../shared/ui/action-list/action-list';
import { FormActions } from '../../../../shared/ui/form-actions/form-actions';
import { FormSection } from '../../../../shared/ui/form-section/form-section';
import { SplitLayout } from '../../../../shared/ui/split-layout/split-layout';
import { RolePicker } from '../../components/role-picker/role-picker';
import { ConfirmService } from '../../../../shared/ui/confirm-dialog/confirm-service';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { LoadingBlock } from '../../../../shared/ui/loading-block/loading-block';
import { TextField } from '../../../../shared/ui/text-field/text-field';
import { UserStatusBadge } from '../../components/user-status-badge/user-status-badge';
import { UserSummary } from '../../components/user-summary/user-summary';
import { UsersApi } from '../../data/users-api';
import { ROLES, ROLE_LABELS } from '../../../../core/auth/role';
import { Role } from '../../../../core/auth/auth.model';
import { User, UserStatus } from '../../user.model';

@Component({
  selector: 'app-user-detail-page',
  imports: [
    TranslocoPipe,
    ReactiveFormsModule,
    Alert,
    Button,
    Card,
    ActionItem,
    ActionList,
    FormActions,
    FormSection,
    RolePicker,
    SplitLayout,
    PageHeader,
    LoadingBlock,
    TextField,
    UserStatusBadge,
    UserSummary,
  ],
  templateUrl: './user-detail-page.html',
  styleUrl: './user-detail-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDetailPage {
  private readonly errorText = inject(ErrorText);
  private readonly api = inject(UsersApi);
  private readonly auth = inject(AuthService);
  private readonly confirm = inject(ConfirmService);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly id = input.required<string>();

  protected readonly roleLabels = ROLE_LABELS;
  protected readonly formatPhone = formatPhone;
  protected readonly formatName = formatNameInput;
  protected readonly user = signal<User | null>(null);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly busy = signal(false);
  protected readonly error = this.errorText.state();
  protected readonly saved = signal(false);
  protected readonly resetSent = signal(false);
  protected readonly rolesMissing = signal(false);
  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(150), personNameValidator]],
    phone: ['', [Validators.required, phoneValidator]],
    roles: this.fb.group({
      ADMIN: false,
      CONDOMINIUM_ADMIN: false,
      RESIDENT: false,
    }),
  });
  protected readonly isSelf = computed(() => this.auth.user()?.id === this.id());

  constructor() {
    toObservable(this.id)
      .pipe(
        switchMap((id) => {
          this.loading.set(true);
          this.error.clear();
          return this.api.get(id).pipe(
            catchError((error: unknown) => {
              this.error.setFrom(error);
              this.loading.set(false);
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((user) => {
        this.setUser(user);
        this.loading.set(false);
      });
  }

  protected canResetPassword(): boolean {
    return this.user()?.status === 'ACTIVE' && !this.isSelf();
  }

  protected save(): void {
    if (this.busy()) return;
    if (this.form.invalid) {
      this.form.markAllAsDirty();
      this.form.markAllAsTouched();
      focusFirstInvalid(this.host.nativeElement);
      return;
    }
    const { name, phone, roles } = this.form.getRawValue();
    const selected = ROLES.filter((role) => roles[role]);
    if (!this.isSelf() && selected.length === 0) {
      this.rolesMissing.set(true);
      return;
    }
    this.rolesMissing.set(false);
    this.saving.set(true);
    this.busy.set(true);
    this.saved.set(false);
    this.error.clear();
    this.api
      .update(this.id(), {
        name: formatPersonName(name),
        phone: onlyDigits(phone),
        ...(this.isSelf() ? {} : { roles: selected }),
      })
      .pipe(finalize(() => this.busy.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => {
          this.setUser(user);
          this.saving.set(false);
          this.saved.set(true);
        },
        error: (error: unknown) => {
          const apiError = toApiError(error);
          this.saving.set(false);
          if (!setServerErrors(this.form.controls, apiError.fieldErrors)) this.error.set(apiError);
        },
      });
  }

  protected approve(): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.confirm
      .confirm({
        title: 'admin.approveDialog.title',
        message: 'admin.approveDialog.message',
        params: { name: this.user()?.name ?? '' },
        confirmLabel: 'admin.approveDialog.confirm',
      })
      .pipe(
        switchMap((confirmed) => (confirmed ? this.api.approve(this.id()) : EMPTY)),
        finalize(() => this.busy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (user) => this.setUser(user),
        error: (error: unknown) => this.error.setFrom(error),
      });
  }

  protected sendPasswordReset(): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.resetSent.set(false);
    this.error.clear();
    this.confirm
      .confirm({
        title: 'admin.passwordResetDialog.title',
        message: 'admin.passwordResetDialog.message',
        confirmLabel: 'admin.passwordResetDialog.confirm',
      })
      .pipe(
        switchMap((confirmed) => (confirmed ? this.auth.sendPasswordReset(this.id()) : EMPTY)),
        finalize(() => this.busy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.resetSent.set(true),
        error: (error: unknown) => this.error.setFrom(error),
      });
  }

  protected setStatus(status: UserStatus, dialog: string): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.confirm
      .confirm({
        title: `admin.${dialog}.title`,
        message: `admin.${dialog}.message`,
        params: { name: this.user()?.name ?? '' },
        confirmLabel: `admin.${dialog}.confirm`,
      })
      .pipe(
        switchMap((confirmed) => (confirmed ? this.api.update(this.id(), { status }) : EMPTY)),
        finalize(() => this.busy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (user) => this.setUser(user),
        error: (error: unknown) => this.error.setFrom(error),
      });
  }

  protected deactivate(): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.confirm
      .confirm({
        title: 'admin.deactivateDialog.title',
        message: 'admin.deactivateDialog.message',
        params: { name: this.user()?.name ?? '' },
        confirmLabel: 'admin.deactivateDialog.confirm',
        danger: true,
      })
      .pipe(
        switchMap((confirmed) => (confirmed ? this.api.deactivate(this.id()) : EMPTY)),
        finalize(() => this.busy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => void this.router.navigate(['/admin/users']),
        error: (error: unknown) => this.error.setFrom(error),
      });
  }

  private setUser(user: User): void {
    this.user.set(user);
    this.form.reset({
      name: user.name,
      phone: formatPhone(user.phone),
      roles: Object.fromEntries(ROLES.map((role) => [role, user.roles.includes(role)])) as Record<
        Role,
        boolean
      >,
    });
  }
}
