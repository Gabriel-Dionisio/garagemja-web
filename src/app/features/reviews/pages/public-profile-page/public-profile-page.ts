import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthService } from '../../../../core/auth/auth-service';
import { ErrorText } from '../../../../core/i18n/error-text';
import { LocaleService } from '../../../../core/i18n/locale-service';
import { moneyFormatter } from '../../../../shared/forms/format';
import { PublicProfile } from '../../../../shared/reviews/review.model';
import { ReviewList, ReviewSource } from '../../../../shared/reviews/review-list/review-list';
import { ReviewsApi } from '../../../../shared/reviews/reviews-api';
import { Alert } from '../../../../shared/ui/alert/alert';
import { Avatar } from '../../../../shared/ui/avatar/avatar';
import { Card } from '../../../../shared/ui/card/card';
import { Page } from '../../../../shared/ui/page/page';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { Rating } from '../../../../shared/ui/rating/rating';
import { Skeleton } from '../../../../shared/ui/skeleton/skeleton';

@Component({
  selector: 'app-public-profile-page',
  imports: [TranslocoPipe, Alert, Avatar, Card, Page, PageHeader, Rating, ReviewList, Skeleton],
  templateUrl: './public-profile-page.html',
  styleUrl: './public-profile-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicProfilePage {
  private readonly api = inject(ReviewsApi);
  private readonly locale = inject(LocaleService);
  private readonly userId = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  protected readonly error = inject(ErrorText).state({ 404: 'reviews.profile.notFound' });
  protected readonly profile = signal<PublicProfile | null>(null);
  protected readonly loading = signal(true);
  protected readonly own = inject(AuthService).user()?.id === this.userId;
  protected readonly money = computed(() => moneyFormatter(this.locale.language()));
  protected readonly since = computed(() => {
    const profile = this.profile();
    return profile
      ? new Intl.DateTimeFormat(this.locale.language(), { month: 'long', year: 'numeric' }).format(
          new Date(profile.memberSince),
        )
      : '';
  });
  protected readonly reviews: ReviewSource = (page, size) =>
    this.api.byUser(this.userId, page, size);

  constructor() {
    this.api
      .profile(this.userId)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (profile) => {
          this.profile.set(profile);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.error.setFrom(error);
          this.loading.set(false);
        },
      });
  }
}
