import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthService } from '../../../../core/auth/auth-service';
import { LANGUAGES, Language, LocaleService } from '../../../../core/i18n/locale-service';
import { Alert } from '../../../../shared/ui/alert/alert';
import { Icon } from '../../../../shared/ui/icon/icon';
import { ThemeService } from '../../../../core/theme/theme-service';

@Component({
  selector: 'app-settings-page',
  imports: [FormsModule, TranslocoPipe, Alert, Icon],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage {
  private readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);
  protected readonly locale = inject(LocaleService);
  protected readonly languages = LANGUAGES;
  protected readonly sendingReset = signal(false);
  protected readonly resetSent = signal(false);
  protected readonly resetFailed = signal(false);

  protected changeLanguage(language: Language): void {
    this.locale.set(language);
  }

  protected toggleTheme(): void {
    this.theme.toggle();
  }

  protected requestPasswordReset(): void {
    const email = this.auth.user()?.email;
    if (!email || this.sendingReset()) return;

    this.sendingReset.set(true);
    this.resetSent.set(false);
    this.resetFailed.set(false);
    this.auth
      .forgotPassword(email)
      .pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe({
        next: () => {
          this.sendingReset.set(false);
          this.resetSent.set(true);
        },
        error: () => {
          this.sendingReset.set(false);
          this.resetFailed.set(true);
        },
      });
  }
}
