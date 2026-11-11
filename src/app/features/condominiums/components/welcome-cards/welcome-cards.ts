import { TranslocoPipe } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../../../../shared/ui/icon/icon';

@Component({
  selector: 'app-welcome-cards',
  imports: [TranslocoPipe, RouterLink, Icon],
  templateUrl: './welcome-cards.html',
  styleUrl: './welcome-cards.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WelcomeCards {
  readonly code = output<void>();
  readonly cnpj = output<void>();
}
