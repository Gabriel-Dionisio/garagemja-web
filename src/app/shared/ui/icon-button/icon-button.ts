import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

export type IconButtonVariant = 'neutral' | 'primary' | 'fab';

@Component({
  selector: 'button[appIconButton], a[appIconButton]',
  template: '<ng-content />',
  styleUrl: './icon-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.aria-label]': 'label()',
    '[attr.title]': 'label()',
    '[attr.data-variant]': 'variant()',
    '[attr.disabled]': 'disabled() || loading() ? "" : null',
    '[attr.aria-busy]': 'loading() ? "true" : null',
  },
})
export class IconButton {
  readonly label = input.required<string>();
  readonly variant = input<IconButtonVariant>('neutral');
  readonly loading = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
}
