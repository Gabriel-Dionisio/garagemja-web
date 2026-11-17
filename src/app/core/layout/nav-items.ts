import { Role } from '../auth/auth.model';
import { IconName } from '../../shared/ui/icon/icon';

export interface NavItem {
  labelKey: string;
  path: string;
  icon: IconName;
  roles?: Role[];
  exact?: boolean;
  group?: 'management';
  badge?: 'condominiums';
}

export const NAV_ITEMS: readonly NavItem[] = [
  { labelKey: 'nav.dashboard', path: '/dashboard', icon: 'shield', roles: ['ADMIN'] },
  {
    labelKey: 'nav.home',
    path: '/home',
    icon: 'home',
    roles: ['RESIDENT', 'CONDOMINIUM_ADMIN'],
  },
  {
    labelKey: 'nav.searchVacancies',
    path: '/search-vacancies',
    icon: 'search',
    roles: ['RESIDENT'],
  },
  { labelKey: 'nav.condominiums', path: '/condominiums', icon: 'building', badge: 'condominiums' },
  { labelKey: 'nav.myParkingSpots', path: '/parking-spots', icon: 'parking', roles: ['RESIDENT'] },
  { labelKey: 'nav.myRentals', path: '/rentals', icon: 'calendar', roles: ['RESIDENT'] },
  { labelKey: 'nav.requests', path: '/requests', icon: 'mail', roles: ['RESIDENT'] },
  {
    labelKey: 'nav.wallet',
    path: '/wallet',
    icon: 'wallet',
    roles: ['RESIDENT', 'CONDOMINIUM_ADMIN', 'ADMIN'],
  },
  { labelKey: 'nav.myVehicles', path: '/vehicles', icon: 'car', roles: ['RESIDENT'] },
  {
    labelKey: 'nav.dashboard',
    path: '/dashboard',
    icon: 'shield',
    roles: ['RESIDENT', 'CONDOMINIUM_ADMIN'],
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
    icon: 'eye',
    roles: ['ADMIN'],
    group: 'management',
  },
];

export function navItemsFor(roles: readonly Role[]): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.some((role) => roles.includes(role)));
}
