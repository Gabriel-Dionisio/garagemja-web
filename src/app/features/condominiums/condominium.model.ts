export type CondominiumStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'BLOCKED' | 'CLOSED';

export interface Condominium {
  id: string;
  name: string;
  cnpj: string | null;
  address: string | null;
  district: string | null;
  number: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  status: CondominiumStatus;
  statusReason: string | null;
  requestedBy: string | null;
  canManage: boolean;
  resides: boolean;
  residency: Residency | null;
  contacts: CondominiumContact[];
  createdAt: string;
  imageUrl: string | null;
  thumbnailUrl: string | null;
}

export interface Residency {
  id: string;
  status: ResidentStatus;
  unit: string | null;
  block: string | null;
}

export interface CondominiumContact {
  name: string;
  email: string | null;
}

export interface CondominiumRules {
  maxRentalDays: number | null;
  minAdvanceHours: number | null;
  cancellationDeadlineHours: number | null;
  maxPricePerDay: number | null;
}

export interface CondominiumLookup {
  name: string;
  city: string | null;
  state: string | null;
}

export interface CondominiumImage {
  id: string;
  url: string;
}

export interface CondominiumCounts {
  residents: number;
  parkingSpots: number;
  activeRentals: number;
}

export interface ManagerTransfer {
  fromUserId: string;
  email: string;
  reason: string;
}

export interface CondominiumDraft {
  name: string;
  cnpj: string;
  address?: string | undefined;
  district?: string | undefined;
  number?: string | undefined;
  city?: string | undefined;
  state?: string | undefined;
  zipCode?: string | undefined;
  requesterResides?: boolean | undefined;
}

export interface CondominiumChanges {
  name?: string | undefined;
  address?: string | undefined;
  district?: string | undefined;
  number?: string | undefined;
  city?: string | undefined;
  state?: string | undefined;
  zipCode?: string | undefined;
  status?: CondominiumStatus | undefined;
  statusReason?: string | undefined;
}

export interface Manager {
  userId: string;
  name: string;
  email: string;
  showEmail: boolean;
}

export type ResidentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'BLOCKED';

export interface JoinPreview extends CondominiumLookup {
  condominiumId: string;
}

export interface JoinRequest {
  unit: string;
  block?: string | undefined;
}

export interface ResidentMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  unit: string | null;
  block: string | null;
  status: ResidentStatus;
  emailVerified: boolean;
}

export interface ManagedCondominium extends CondominiumCounts {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  status: CondominiumStatus;
  pendingResidents: number;
  resides: boolean;
}

export interface ManagerInvite {
  id: string;
  condominiumId: string;
  condominiumName: string;
  invitedEmail: string;
  requested: boolean;
  expiresAt: string;
}

export interface CondominiumFilter {
  name?: string;
  city?: string;
  state?: string;
  status?: CondominiumStatus;
  newestFirst?: boolean;
  mine?: boolean;
}
