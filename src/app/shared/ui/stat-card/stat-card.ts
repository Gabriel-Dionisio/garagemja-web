import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Params, RouterLink } from '@angular/router';

@Component({
  selector: 'app-stat-card',
  imports: [RouterLink],
  templateUrl: './stat-card.html',
  styleUrl: './stat-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatCard {
  readonly value = input.required<number>();
  readonly label = input.required<string>();
  readonly highlight = input(false);
  readonly link = input<string | null>(null);
  readonly queryParams = input<Params | null>(null);
}
