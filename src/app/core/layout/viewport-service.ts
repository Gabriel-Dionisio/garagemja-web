import { BreakpointObserver } from '@angular/cdk/layout';
import { Injectable, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

export const BREAKPOINTS = {
  tablet: '(min-width: 768px)',
} as const;

@Injectable({ providedIn: 'root' })
export class ViewportService {
  private readonly observer = inject(BreakpointObserver);
  private readonly matches = toSignal(
    this.observer.observe([BREAKPOINTS.tablet]).pipe(map((state) => state.breakpoints)),
    { initialValue: { [BREAKPOINTS.tablet]: this.observer.isMatched(BREAKPOINTS.tablet) } },
  );

  readonly usesDrawer = computed(() => this.matches()[BREAKPOINTS.tablet] !== true);
}
