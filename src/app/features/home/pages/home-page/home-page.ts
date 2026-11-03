import { DecimalPipe } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FeaturedCondominium } from '../../home.model';

@Component({
  selector: 'app-home-page',
  imports: [DecimalPipe, TranslocoPipe],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  protected readonly featuredCondominiums: readonly FeaturedCondominium[] = [
    {
      id: 1,
      name: 'Residencial Alpha',
      availableVagas: 12,
      pricePerHour: 8,
      imageUrl: '/images/home-hero.png',
    },
    {
      id: 2,
      name: 'Condomínio Parque Sul',
      availableVagas: 8,
      pricePerHour: 12,
      imageUrl: '/images/home-hero.png',
    },
    {
      id: 3,
      name: 'Residencial das Flores',
      availableVagas: 5,
      pricePerHour: 10,
      imageUrl: '/images/home-hero.png',
    },
  ];
}
