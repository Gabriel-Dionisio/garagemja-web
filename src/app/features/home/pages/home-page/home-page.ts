import { DateField } from '../../../../shared/ui/date-field/date-field';
import { DecimalPipe } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth-service';
import { HomeApi } from '../../data/home-api';
import { FeaturedCondominium } from '../../home.model';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { Skeleton } from '../../../../shared/ui/skeleton/skeleton';
import { SkeletonBlock } from '../../../../shared/ui/skeleton/skeleton-block';
import { Alert } from '../../../../shared/ui/alert/alert';
import { Button } from '../../../../shared/ui/button/button';

@Component({
  selector: 'app-home-page',
  imports: [
    DateField,
    DecimalPipe,
    RouterLink,
    Button,
    TranslocoPipe,
    EmptyState,
    Skeleton,
    SkeletonBlock,
    Alert,
  ],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  private readonly api = inject(HomeApi);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly featuredCondominiums = signal<FeaturedCondominium[]>([]);
  protected readonly hasResidency = signal(true);
  protected readonly loading = signal(true);
  protected readonly loadFailed = signal(false);
  protected readonly placeholders = [1, 2, 3];
  protected readonly fallbackImage = '/images/home-hero-800.webp';

  constructor() {
    this.api
      .loadMine()
      .pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe({
        next: ({ residencies, condominiums }) => {
          this.hasResidency.set(residencies > 0);
          if (residencies === 0 && !this.auth.hasRole('CONDOMINIUM_ADMIN')) {
            void this.router.navigate(['/condominiums'], { replaceUrl: true });
          }
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
    if (image.src.endsWith(this.fallbackImage)) return;
    image.src = this.fallbackImage;
  }
}
