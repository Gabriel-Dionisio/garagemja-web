import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

/** Mapa meramente ilustrativo: sem serviço de mapas, coordenadas ou interação. */
@Component({
  selector: 'app-illustrative-map',
  imports: [TranslocoPipe],
  templateUrl: './illustrative-map.html',
  styleUrl: './illustrative-map.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IllustrativeMap {
  protected readonly pins = [
    { x: 34, y: 21 },
    { x: 78, y: 28 },
    { x: 66, y: 55 },
    { x: 22, y: 62 },
    { x: 84, y: 75 },
    { x: 58, y: 88 },
  ];
}
