import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Icon } from '../icon/icon';
import { LANGUAGES, Language, LocaleService } from '../../../core/i18n/locale-service';

@Component({
  selector: 'app-language-switcher',
  imports: [TranslocoPipe, Icon],
  templateUrl: './language-switcher.html',
  styleUrl: './language-switcher.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSwitcher {
  protected readonly locale = inject(LocaleService);
  protected readonly languages = LANGUAGES;

  protected choose(language: Language): void {
    this.locale.set(language);
  }
}
