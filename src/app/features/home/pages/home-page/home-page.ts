import { DecimalPipe } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { HomeApi } from '../../data/home-api';

@Component({
  selector: 'app-home-page',
  imports: [DecimalPipe, TranslocoPipe],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  private readonly api = inject(HomeApi);
  protected readonly featuredCondominiums = toSignal(
    this.api.loadFeatured().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );
  protected readonly fallbackImage = '/images/home-hero.png';
}
