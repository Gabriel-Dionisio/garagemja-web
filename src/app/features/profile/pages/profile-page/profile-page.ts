import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth-service';
import { ErrorText } from '../../../../core/i18n/error-text';
import { focusFirstInvalid } from '../../../../shared/forms/focus-first-invalid';
import { formatNameInput, formatPhone } from '../../../../shared/forms/masks';
import {
  formatPersonName,
  personNameValidator,
  phoneValidator,
} from '../../../../shared/forms/validators';
import { Alert } from '../../../../shared/ui/alert/alert';
import { Button } from '../../../../shared/ui/button/button';
import { Card } from '../../../../shared/ui/card/card';
import { FormActions } from '../../../../shared/ui/form-actions/form-actions';
import { FormSection } from '../../../../shared/ui/form-section/form-section';
import { LoadingBlock } from '../../../../shared/ui/loading-block/loading-block';
import { Page } from '../../../../shared/ui/page/page';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { TextField } from '../../../../shared/ui/text-field/text-field';
import { UserSummary } from '../../../../shared/ui/user-summary/user-summary';
import { ProfileApi } from '../../data/profile-api';
import { Profile, profileChanges } from '../../profile.model';

@Component({
  selector: 'app-profile-page',
  imports: [
    TranslocoPipe,
    ReactiveFormsModule,
    Alert,
    Button,
    Card,
    FormActions,
    FormSection,
    LoadingBlock,
    Page,
    PageHeader,
    TextField,
    UserSummary,
  ],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePage {
  private readonly api = inject(ProfileApi);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly error = inject(ErrorText).state();
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly saved = signal(false);
  protected readonly profile = signal<Profile | null>(null);
  protected readonly formatName = formatNameInput;
  protected readonly formatPhone = formatPhone;
  protected readonly emailControl = new FormControl<string>(
    { value: '', disabled: true },
    { nonNullable: true },
  );
  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(150), personNameValidator]],
    phone: ['', [Validators.required, phoneValidator]],
  });

  constructor() {
    const id = this.auth.user()?.id;
    if (!id) {
      this.loading.set(false);
      return;
    }

    this.api
      .get(id)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (profile) => this.show(profile),
        error: (error: unknown) => this.error.setFrom(error),
      });
  }

  protected save(): void {
    if (this.form.invalid) {
      focusFirstInvalid(this.host.nativeElement);
      return;
    }
    const id = this.auth.user()?.id;
    const current = this.profile();
    if (!id || !current || this.saving()) return;

    this.saved.set(false);
    this.error.clear();
    const { name, phone } = this.form.getRawValue();
    const changes = profileChanges(current, name, phone);
    if (Object.keys(changes).length === 0) return;

    this.saving.set(true);
    this.api
      .update(id, changes)
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (profile) => {
          this.show(profile);
          if (changes.name) this.auth.updateCurrentUser({ name: profile.name });
          this.saved.set(true);
        },
        error: (error: unknown) => this.error.setFrom(error),
      });
  }

  private show(profile: Profile): void {
    this.profile.set(profile);
    this.emailControl.setValue(profile.email);
    this.form.reset({
      name: formatPersonName(profile.name),
      phone: formatPhone(profile.phone),
    });
  }
}
