import { TranslocoPipe } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { version } from '../../../../../package.json';
import { ApiAvailability } from '../../http/api-availability';

@Component({
  selector: 'app-version',
  imports: [TranslocoPipe],
  template: `
    @if (availability.apiVersion()) {
      <span
        class="dot"
        role="img"
        [class.degraded]="availability.degraded()"
        [attr.aria-label]="
          (availability.degraded() ? 'status.degraded' : 'status.operational') | transloco
        "
        [attr.title]="
          (availability.degraded() ? 'status.degraded' : 'status.operational') | transloco
        "
      ></span>
    }
    Web v{{ web }}
    @if (availability.apiVersion(); as api) {
      · API v{{ api }}
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--font-size-sm);
      opacity: 0.85;
    }
    .dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      background: #4ade80;
    }
    .dot.degraded {
      background: #fbbf24;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppVersion {
  protected readonly availability = inject(ApiAvailability);
  protected readonly web = version;

  constructor() {
    this.availability.loadVersion();
  }
}
