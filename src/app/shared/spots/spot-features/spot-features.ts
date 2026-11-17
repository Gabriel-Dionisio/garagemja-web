import { TranslocoPipe } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Badge } from '../../ui/badge/badge';
import { Icon } from '../../ui/icon/icon';
import { PARKING_SPOT_SIZE_LABELS } from '../parking-spot-status';
import { ParkingSpot } from '../parking-spot.model';

@Component({
  selector: 'app-spot-features',
  imports: [TranslocoPipe, Badge, Icon],
  templateUrl: './spot-features.html',
  styleUrl: './spot-features.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpotFeatures {
  readonly spot = input.required<Pick<ParkingSpot, 'size' | 'covered'>>();
  protected readonly sizeLabels = PARKING_SPOT_SIZE_LABELS;
}
