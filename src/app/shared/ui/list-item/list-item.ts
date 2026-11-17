import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, booleanAttribute, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'li[appListItem]',
  imports: [NgTemplateOutlet, RouterLink],
  templateUrl: './list-item.html',
  styleUrl: './list-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListItem {
  readonly link = input<string | readonly unknown[] | null>(null);
  readonly activatable = input(false, { transform: booleanAttribute });
  readonly activated = output<void>();
  readonly queryParams = input<Record<string, string> | null>(null);
}
