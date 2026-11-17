export const NOTIFICATION_KINDS = [
  'CONDOMINIUM_APPROVED',
  'CONDOMINIUM_REJECTED',
  'CONDOMINIUM_BLOCKED',
  'CONDOMINIUM_CLOSED',
  'RESIDENT_APPROVED',
  'RESIDENT_REJECTED',
  'RESIDENCY_ENDED',
  'MANAGER_INVITED',
  'MANAGER_REMOVED',
  'RENTAL_REQUESTED',
  'RENTAL_APPROVED',
  'RENTAL_REFUSED',
  'RENTAL_CANCELED',
  'RENTAL_EXPIRED',
  'RENTAL_AUTO_REFUSED',
  'RENTAL_SPOT_UNAVAILABLE',
  'RENTAL_UNPAID_CANCELED',
  'PAYMENT_CONFIRMED',
  'PAYMENT_RECEIVED',
  'PARKING_SPOT_APPROVED',
  'PARKING_SPOT_REJECTED',
  'PARKING_SPOT_BLOCKED',
  'PARKING_SPOT_UNBLOCKED',
  'REVIEW_INVITE',
  'REVIEW_REPORT_KEPT',
  'REVIEW_REPORT_HIDDEN',
] as const;

export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  condominiumName: string;
  reason: string | null;
  createdAt: string;
  read: boolean;
}

const DESTINATIONS: Record<string, string> = {
  RENTAL_REQUESTED: '/requests',
  PAYMENT_RECEIVED: '/requests',
  RENTAL: '/rentals',
  PAYMENT: '/rentals',
  REVIEW_INVITE: '/rentals',
  CONDOMINIUM: '/condominiums',
  RESIDENT: '/condominiums',
  RESIDENCY: '/condominiums',
  MANAGER: '/condominiums',
  PARKING: '/parking-spots',
};

export function notificationDestination(kind: NotificationKind): string | null {
  return DESTINATIONS[kind] ?? DESTINATIONS[kind.split('_')[0]] ?? null;
}
