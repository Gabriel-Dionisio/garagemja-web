import { Role } from '../auth/auth.model';
import { IconName } from '../../shared/ui/icon/icon';

export interface NavItem {
  labelKey: string;
  path: string;
  icon: IconName;
  roles?: Role[];
}

export const NAV_ITEMS: readonly NavItem[] = [
  { labelKey: 'nav.home', path: '/home', icon: 'home' },
  { labelKey: 'nav.users', path: '/admin/users', icon: 'users', roles: ['ADMIN'] },
];

export function navItemsFor(roles: readonly Role[]): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.some((role) => roles.includes(role)));
}
