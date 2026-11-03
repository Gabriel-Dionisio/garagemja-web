import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ApiAvailability } from './core/http/api-availability';
import { ServiceUnavailable } from './core/layout/service-unavailable/service-unavailable';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ServiceUnavailable],
  template: `
    <div class="app" [attr.inert]="availability.unavailable() ? '' : null">
      <router-outlet />
    </div>
    @if (availability.unavailable()) {
      <app-service-unavailable />
    }
  `,
  styles: ':host .app { display: contents; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly availability = inject(ApiAvailability);
}
