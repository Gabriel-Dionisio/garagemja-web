export interface FeaturedCondominium {
  id: string;
  name: string;
  availableVagas: number;
  pricePerHour: number | null;
  imageUrl: string | null;
}

export interface HomeSpots {
  residencies: number;
  condominiums: FeaturedCondominium[];
}
