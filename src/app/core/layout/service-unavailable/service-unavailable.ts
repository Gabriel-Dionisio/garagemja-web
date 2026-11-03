import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Button } from '../../../shared/ui/button/button';
import { Icon } from '../../../shared/ui/icon/icon';
import { ApiAvailability } from '../../http/api-availability';

@Component({
  selector: 'app-service-unavailable',
  imports: [TranslocoPipe, Button, Icon],
  templateUrl: './service-unavailable.html',
  styleUrl: './service-unavailable.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceUnavailable {
  protected readonly availability = inject(ApiAvailability);
}
