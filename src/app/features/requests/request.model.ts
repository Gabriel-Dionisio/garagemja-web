import { RentalStatus } from '../dashboard/owned-rental.model';

export type RequestStatus = Extract<RentalStatus, 'PENDING' | 'APPROVED' | 'REFUSED'>;
export type RequestDecision = Extract<RentalStatus, 'APPROVED' | 'REFUSED'>;

export interface RequestTab {
  path: string;
  status: RequestStatus;
  labelKey: string;
}

export const REQUEST_TABS: readonly RequestTab[] = [
  { path: 'pending', status: 'PENDING', labelKey: 'requests.tabs.pending' },
  { path: 'approved', status: 'APPROVED', labelKey: 'requests.tabs.approved' },
  { path: 'refused', status: 'REFUSED', labelKey: 'requests.tabs.refused' },
];
