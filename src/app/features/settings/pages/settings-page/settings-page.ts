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
import { AuthService } from '../../../../core/auth/auth-service';
import { ErrorText } from '../../../../core/i18n/error-text';
import { LANGUAGES, Language, LocaleService } from '../../../../core/i18n/locale-service';
import { ThemeService } from '../../../../core/theme/theme-service';
import { Alert } from '../../../../shared/ui/alert/alert';
import { Button } from '../../../../shared/ui/button/button';
import { Card } from '../../../../shared/ui/card/card';
import { FormSection } from '../../../../shared/ui/form-section/form-section';
import { Page } from '../../../../shared/ui/page/page';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { SelectField, SelectOption } from '../../../../shared/ui/select-field/select-field';
import { Switch } from '../../../../shared/ui/switch/switch';

@Component({
  selector: 'app-settings-page',
  imports: [TranslocoPipe, Alert, Button, Card, FormSection, Page, PageHeader, SelectField, Switch],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage {
  private readonly auth = inject(AuthService);
  private readonly locale = inject(LocaleService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly theme = inject(ThemeService);
  protected readonly resetError = inject(ErrorText).state();
  protected readonly email = computed(() => this.auth.user()?.email ?? null);
  protected readonly sendingReset = signal(false);
  protected readonly resetSent = signal(false);
  protected readonly languageOptions: SelectOption[] = LANGUAGES.map((value) => ({
    value,
    label: `language.${value}`,
  }));
  protected readonly languageControl = new FormControl<string>(this.locale.language(), {
    nonNullable: true,
  });

  constructor() {
    this.languageControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((language) => this.locale.set(language as Language));
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
}
