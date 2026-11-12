import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoPipe } from '@jsverse/transloco';
import { finalize } from 'rxjs';
import { ErrorText } from '../../../../core/i18n/error-text';
import { Page } from '../../../../shared/models/page';
import { ListItem } from '../../../../shared/ui/list-item/list-item';
import { ListState } from '../../../../shared/ui/list-state/list-state';
import { Paginator } from '../../../../shared/ui/paginator/paginator';
import { SecurityApi } from '../../data/security-api';
import { SecurityEvent } from '../../security.model';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-security-events',
  imports: [DatePipe, TranslocoPipe, ListItem, ListState, Paginator],
  templateUrl: './security-events.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecurityEvents {
  private readonly api = inject(SecurityApi);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly error = inject(ErrorText).state();
  protected readonly result = signal<Page<SecurityEvent> | null>(null);
  protected readonly loading = signal(true);

  constructor() {
    this.goTo(0);
  }

  protected goTo(page: number): void {
    this.loading.set(true);
    this.error.clear();
    this.api
      .events(page, PAGE_SIZE)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (result) => this.result.set(result),
        error: (error: unknown) => this.error.setFrom(error),
      });
  }
}
