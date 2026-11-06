import { DecimalPipe } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HomeApi } from '../../data/home-api';
import { FeaturedCondominium } from '../../home.model';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { LoadingBlock } from '../../../../shared/ui/loading-block/loading-block';
import { Alert } from '../../../../shared/ui/alert/alert';

@Component({
  selector: 'app-home-page',
  imports: [DecimalPipe, TranslocoPipe, EmptyState, LoadingBlock, Alert],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  private readonly api = inject(HomeApi);
  protected readonly featuredCondominiums = signal<FeaturedCondominium[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadFailed = signal(false);
  protected readonly fallbackImage = '/images/home-hero.png';

  constructor() {
    this.api
      .loadFeatured()
      .pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe({
        next: (condominiums) => {
          this.featuredCondominiums.set(condominiums);
          this.loading.set(false);
        },
        error: () => {
          this.loadFailed.set(true);
          this.loading.set(false);
        },
      });
  }

  protected useFallback(event: Event): void {
    const image = event.target as HTMLImageElement;
    if (image.src.endsWith('/images/home-hero.png')) return;
    image.src = this.fallbackImage;
  }
}
