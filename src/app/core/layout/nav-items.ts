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
  { labelKey: 'nav.condominiums', path: '/condominiums', icon: 'building', badge: 'condominiums' },
  { labelKey: 'nav.dashboard', path: '/dashboard', icon: 'shield', roles: ['CONDOMINIUM_ADMIN'] },
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
  { labelKey: 'nav.settings', path: '/settings', icon: 'settings' },
];

export function navItemsFor(roles: readonly Role[]): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.some((role) => roles.includes(role)));
}
