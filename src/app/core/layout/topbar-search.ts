import { Injectable, signal } from '@angular/core';

/** Termo digitado no campo de pesquisa da barra superior; só é alimentado em rotas com `data.topbarSearch`. */
@Injectable({ providedIn: 'root' })
export class TopbarSearch {
  readonly term = signal('');
}
