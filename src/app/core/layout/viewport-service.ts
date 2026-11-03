import { BreakpointObserver } from '@angular/cdk/layout';
import { Injectable, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

export const BREAKPOINTS = {
  desktop: '(min-width: 1280px)',
} as const;

@Injectable({ providedIn: 'root' })
export class ViewportService {
  private readonly observer = inject(BreakpointObserver);
  private readonly matches = toSignal(
    this.observer.observe([BREAKPOINTS.desktop]).pipe(map((state) => state.breakpoints)),
    { initialValue: this.snapshot() },
  );

  readonly isDesktop = computed(() => this.matches()[BREAKPOINTS.desktop] === true);
  readonly usesDrawer = computed(() => !this.isDesktop());

  private snapshot(): Record<string, boolean> {
    return {
      [BREAKPOINTS.desktop]: this.observer.isMatched(BREAKPOINTS.desktop),
    };
  }
}
