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
import { TranslocoPipe } from '@jsverse/transloco';
import { EMPTY, catchError, finalize, map, switchMap, tap } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth-service';
import { ErrorText } from '../../../../core/i18n/error-text';
import { formatNameInput, formatPhone, onlyDigits } from '../../../../shared/forms/masks';
import { focusFirstInvalid } from '../../../../shared/forms/focus-first-invalid';
import {
  formatPersonName,
  personNameValidator,
  phoneValidator,
} from '../../../../shared/forms/validators';
import { Avatar } from '../../../../shared/ui/avatar/avatar';
import { Button } from '../../../../shared/ui/button/button';
import { LoadingBlock } from '../../../../shared/ui/loading-block/loading-block';
import { TextField } from '../../../../shared/ui/text-field/text-field';
import { Profile, ProfileChanges } from '../../profile.model';
import { ProfileApi } from '../../data/profile-api';
import { ApiError } from '../../../../shared/models/api-error';

@Component({
  selector: 'app-profile-page',
  imports: [
    TranslocoPipe,
    ReactiveFormsModule,
    Avatar,
    Button,
    LoadingBlock,
    TextField,
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
  protected readonly errorText = inject(ErrorText);
  protected readonly error = this.errorText.state();
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly saved = signal(false);
  protected readonly profile = signal<Profile | null>(null);
  protected readonly formatName = formatNameInput;
  protected readonly formatPhone = formatPhone;
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
        tap((profile) => {
          this.profile.set(profile);
          this.form.reset({
            name: formatPersonName(profile.name),
            phone: formatPhone(profile.phone),
          });
          this.loading.set(false);
        }),
        catchError((error: unknown) => {
          this.error.setFrom(error);
          this.loading.set(false);
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected save(): void {
    if (this.form.invalid) {
      focusFirstInvalid(this.host.nativeElement);
      return;
    }
    const id = this.auth.user()?.id;
    if (!id || this.saving()) return;

    this.saving.set(true);
    this.saved.set(false);
    this.error.clear();
    const { name, phone } = this.form.getRawValue();
    const current = this.profile();
    const changes = {
      name: formatPersonName(name),
      phone: onlyDigits(phone),
    };
    const update: ProfileChanges = {
      ...(current?.name !== changes.name ? { name: changes.name } : {}),
      ...(current?.phone !== changes.phone ? { phone: changes.phone } : {}),
    };
    if (Object.keys(update).length === 0) {
      this.saved.set(true);
      this.saving.set(false);
      return;
    }
    this.api
      .update(id, update)
      .pipe(
        switchMap(() =>
          this.api.get(id).pipe(
            map((persisted) => persisted),
          ),
        ),
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (profile) => {
          const persistedExpected =
            (update.name === undefined || formatPersonName(profile.name) === update.name) &&
            (update.phone === undefined || profile.phone === update.phone);
          if (!persistedExpected) {
            const persistenceError: ApiError = {
              status: 200,
              message: 'A API confirmou o salvamento, mas não retornou os dados atualizados.',
              code: null,
              fieldErrors: [],
              retryAfterSeconds: null,
            };
            this.error.set(persistenceError);
            return;
          }
          this.profile.set(profile);
          this.form.reset({
            name: formatPersonName(profile.name),
            phone: formatPhone(profile.phone),
          });
          if (update.name) this.auth.updateCurrentUser({ name: profile.name });
          this.saved.set(true);
        },
        error: (error: unknown) => this.error.setFrom(error),
      });
  }

}
