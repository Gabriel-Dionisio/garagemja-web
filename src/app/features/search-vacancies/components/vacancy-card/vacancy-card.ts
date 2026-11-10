import { DecimalPipe, registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { Badge } from '../../../../shared/ui/badge/badge';
import {
  DEFAULT_PARKING_SPACE_IMAGE,
  Vacancy,
  hasUsableImageUrl,
} from '../../search-vacancies.model';

registerLocaleData(localePt, 'pt');

@Component({
  selector: 'app-vacancy-card',
  imports: [DecimalPipe, TranslocoPipe, Badge],
  templateUrl: './vacancy-card.html',
  styleUrl: './vacancy-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VacancyCard {
  private readonly transloco = inject(TranslocoService);

  readonly vacancy = input.required<Vacancy>();
  protected readonly locale = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  /** Volta a false sempre que o card passa a representar outra vaga. */
  protected readonly imageFailed = linkedSignal<Vacancy, boolean>({
    source: this.vacancy,
    computation: () => false,
  });

  protected readonly imageSrc = computed(() => {
    const url = this.vacancy().imageUrl;
    return !this.imageFailed() && hasUsableImageUrl(url) ? url.trim() : DEFAULT_PARKING_SPACE_IMAGE;
  });

  /** Se a própria imagem padrão falhar, não troca o src de novo (evita loop de erro). */
  protected onImageError(): void {
    if (this.imageSrc() !== DEFAULT_PARKING_SPACE_IMAGE) this.imageFailed.set(true);
  }
}
