export interface FeaturedCondominium {
  id: string;
  name: string;
  availableVagas: number;
  pricePerDay: number | null;
  imageUrl: string | null;
}

export interface HomeSpots {
  residencies: number;
  condominiums: FeaturedCondominium[];
}
