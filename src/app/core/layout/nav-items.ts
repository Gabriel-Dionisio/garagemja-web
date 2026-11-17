import { Role } from '../auth/auth.model';
import { IconName } from '../../shared/ui/icon/icon';

export type NavGroup = 'rent' | 'announce' | 'management';

export interface NavItem {
  labelKey: string;
  path: string;
  icon: IconName;
  roles?: Role[];
  exact?: boolean;
  group?: NavGroup;
  badge?: 'condominiums';
}

export const NAV_GROUP_ORDER: readonly (NavGroup | undefined)[] = [
  undefined,
  'rent',
  'announce',
  'management',
];

export const NAV_GROUP_LABEL_KEY: Record<NavGroup, string> = {
  rent: 'nav.groups.rent',
  announce: 'nav.groups.announce',
  management: 'nav.management',
};

export const NAV_ITEMS: readonly NavItem[] = [
  { labelKey: 'nav.dashboard', path: '/dashboard', icon: 'grid', roles: ['ADMIN'] },
  {
    labelKey: 'nav.home',
    path: '/home',
    icon: 'home',
    roles: ['RESIDENT', 'CONDOMINIUM_ADMIN'],
  },
  {
    labelKey: 'nav.dashboard',
    path: '/dashboard',
    icon: 'grid',
    roles: ['RESIDENT', 'CONDOMINIUM_ADMIN'],
  },
  { labelKey: 'nav.condominiums', path: '/condominiums', icon: 'building', badge: 'condominiums' },
  {
    labelKey: 'nav.spotSearch',
    path: '/search',
    icon: 'search',
    roles: ['RESIDENT'],
    group: 'rent',
  },
  {
    labelKey: 'nav.myRentals',
    path: '/rentals',
    icon: 'calendar',
    roles: ['RESIDENT'],
    group: 'rent',
  },
  {
    labelKey: 'nav.myVehicles',
    path: '/vehicles',
    icon: 'car',
    roles: ['RESIDENT'],
    group: 'rent',
  },
  {
    labelKey: 'nav.myParkingSpots',
    path: '/parking-spots',
    icon: 'parking',
    roles: ['RESIDENT'],
    group: 'announce',
  },
  {
    labelKey: 'nav.requests',
    path: '/requests',
    icon: 'inbox',
    roles: ['RESIDENT'],
    group: 'announce',
  },
  {
    labelKey: 'nav.wallet',
    path: '/wallet',
    icon: 'wallet',
    roles: ['RESIDENT', 'CONDOMINIUM_ADMIN', 'ADMIN'],
    group: 'announce',
  },
  {
    labelKey: 'nav.users',
    path: '/admin/users',
    icon: 'users',
    roles: ['ADMIN'],
    group: 'management',
  },
  {
    labelKey: 'nav.audit',
    path: '/admin/audit-logs',
    icon: 'history',
    roles: ['ADMIN'],
    group: 'management',
  },
];

export function navItemsFor(roles: readonly Role[]): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.some((role) => roles.includes(role)));
}
