export interface Vehicle {
  id: string;
  residentId: string;
  plate: string;
  brand: string | null;
  model: string | null;
  color: string | null;
  thumbnailUrl: string | null;
}

export interface VehicleImage {
  id: string;
  url: string;
}

export interface Residency {
  id: string;
  condominiumId: string;
  condominiumName: string;
  unit: string | null;
  block: string | null;
  approved: boolean;
}

export interface VehicleListItem extends Vehicle {
  residency: Residency | null;
}

export interface VehicleFields {
  plate: string;
  brand: string;
  model: string;
  color: string;
}
