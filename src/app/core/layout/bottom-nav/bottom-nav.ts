import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { Icon } from '../../../shared/ui/icon/icon';
import { NavItem } from '../nav-items';

@Component({
  selector: 'app-bottom-nav',
  imports: [TranslocoPipe, RouterLink, RouterLinkActive, Icon],
  templateUrl: './bottom-nav.html',
  styleUrl: './bottom-nav.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomNav {
  readonly items = input.required<readonly NavItem[]>();
  readonly menuExpanded = input(false);
  readonly menu = output<void>();

  protected readonly entries = computed(() =>
    this.items().map((item) => ({ ...item, label: item.shortLabelKey ?? item.labelKey })),
  );
}
