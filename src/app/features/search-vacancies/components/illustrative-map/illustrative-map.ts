import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

/**
 * Mapa meramente ilustrativo: sem serviço de mapas nem interação. Não exibe marcadores porque
 * a API ainda não fornece coordenadas das vagas (posições inventadas não representariam nada).
 */
@Component({
  selector: 'app-illustrative-map',
  imports: [TranslocoPipe],
  templateUrl: './illustrative-map.html',
  styleUrl: './illustrative-map.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IllustrativeMap {}
