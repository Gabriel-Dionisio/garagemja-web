import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { Observable, finalize } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth-service';
import { ErrorText } from '../../../../core/i18n/error-text';
import { LANGUAGES, Language, LocaleService } from '../../../../core/i18n/locale-service';
import { ThemeService } from '../../../../core/theme/theme-service';
import { Alert } from '../../../../shared/ui/alert/alert';
import { Button } from '../../../../shared/ui/button/button';
import { Card } from '../../../../shared/ui/card/card';
import { FormSection } from '../../../../shared/ui/form-section/form-section';
import { LoadingBlock } from '../../../../shared/ui/loading-block/loading-block';
import { Page } from '../../../../shared/ui/page/page';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { SelectField, SelectOption } from '../../../../shared/ui/select-field/select-field';
import { SettingRow } from '../../../../shared/ui/setting-row/setting-row';
import { Switch } from '../../../../shared/ui/switch/switch';
import { AccountForm, AccountValues } from '../../components/account-form/account-form';
import { AccountPhoto } from '../../components/account-photo/account-photo';
import { SecurityEvents } from '../../components/security-events/security-events';
import { TwoFactor } from '../../components/two-factor/two-factor';
import { ProfileApi } from '../../data/profile-api';
import { Profile, profileChanges } from '../../profile.model';

@Component({
  selector: 'app-settings-page',
  imports: [
    TranslocoPipe,
    AccountForm,
    AccountPhoto,
    Alert,
    Button,
    Card,
    FormSection,
    LoadingBlock,
    Page,
    PageHeader,
    SecurityEvents,
    SelectField,
    SettingRow,
    Switch,
    TwoFactor,
  ],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage {
  private readonly api = inject(ProfileApi);
  private readonly auth = inject(AuthService);
  private readonly locale = inject(LocaleService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly theme = inject(ThemeService);
  protected readonly accountError = inject(ErrorText).state();
  protected readonly resetError = inject(ErrorText).state();
  protected readonly roles = computed(() => this.auth.user()?.roles ?? []);
  protected readonly email = computed(() => this.auth.user()?.email ?? null);
  protected readonly showPhone = computed(() => !this.roles().includes('ADMIN'));
  protected readonly profile = signal<Profile | null>(null);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly photoBusy = signal(false);
  protected readonly saved = signal(false);
  protected readonly sendingReset = signal(false);
  protected readonly resetSent = signal(false);
  protected readonly languageOptions: SelectOption[] = LANGUAGES.map((value) => ({
    value,
    label: `settings.preferences.languages.${value}`,
  }));
  protected readonly languageControl = new FormControl<string>(this.locale.language(), {
    nonNullable: true,
  });

  constructor() {
    this.languageControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((language) => this.locale.set(language as Language));
    this.loadProfile();
  }

  protected saveAccount(values: AccountValues): void {
    const id = this.auth.user()?.id;
    const current = this.profile();
    if (!id || !current || this.saving()) return;

    this.saved.set(false);
    this.accountError.clear();
    const changes = profileChanges(current, values.name, values.phone);
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
          this.profile.set(profile);
          if (changes.name) this.auth.updateCurrentUser({ name: profile.name });
          this.saved.set(true);
        },
        error: (error: unknown) => this.accountError.setFrom(error),
      });
  }

  protected uploadPhoto(file: File): void {
    this.changePhoto((id) => this.api.uploadPhoto(id, file));
  }

  protected removePhoto(): void {
    this.changePhoto((id) => this.api.removePhoto(id));
  }

  protected requestPasswordReset(): void {
    const email = this.email();
    if (!email || this.sendingReset()) return;

    this.sendingReset.set(true);
    this.resetSent.set(false);
    this.resetError.clear();
    this.auth
      .forgotPassword(email)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.sendingReset.set(false);
          this.resetSent.set(true);
        },
        error: (error: unknown) => {
          this.sendingReset.set(false);
          this.resetError.setFrom(error);
        },
      });
  }

  private changePhoto(request: (id: string) => Observable<Profile>): void {
    const id = this.auth.user()?.id;
    if (!id || this.photoBusy()) return;

    this.photoBusy.set(true);
    this.saved.set(false);
    this.accountError.clear();
    request(id)
      .pipe(
        finalize(() => this.photoBusy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (profile) => {
          this.profile.set(profile);
          this.auth.updateCurrentUser({ photoUrl: profile.photoUrl });
        },
        error: (error: unknown) => this.accountError.setFrom(error),
      });
  }

  private loadProfile(): void {
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
        next: (profile) => this.profile.set(profile),
        error: (error: unknown) => this.accountError.setFrom(error),
      });
  }
}
