import { Observable, map } from 'rxjs';
import { ConfirmService } from '../../shared/ui/confirm-dialog/confirm-service';
import { IconName } from '../../shared/ui/icon/icon';
import { CondominiumStatus } from './condominium.model';

export interface StatusAction {
  status: CondominiumStatus;
  key: 'approve' | 'reject' | 'block' | 'unblock' | 'reopen' | 'close';
  icon: IconName;
  primary: boolean;
  needsReason?: boolean;
}

const REJECT: StatusAction = {
  status: 'REJECTED',
  key: 'reject',
  icon: 'close',
  primary: false,
  needsReason: true,
};
const CLOSE: StatusAction = {
  status: 'CLOSED',
  key: 'close',
  icon: 'logout',
  primary: false,
  needsReason: true,
};

export const STATUS_ACTIONS: Record<CondominiumStatus, StatusAction[]> = {
  PENDING: [{ status: 'ACTIVE', key: 'approve', icon: 'check', primary: true }, REJECT],
  ACTIVE: [{ status: 'BLOCKED', key: 'block', icon: 'ban', primary: false }, CLOSE],
  BLOCKED: [{ status: 'ACTIVE', key: 'unblock', icon: 'user-check', primary: true }, CLOSE],
  CLOSED: [],
  REJECTED: [{ status: 'PENDING', key: 'reopen', icon: 'building', primary: false }],
};

export function askStatusChange(
  confirm: ConfirmService,
  action: StatusAction,
  name: string,
): Observable<string | null> {
  const dialog = {
    title: `condominiums.dialog.${action.key}.title`,
    message: `condominiums.dialog.${action.key}.message`,
    params: { name },
    confirmLabel: `condominiums.dialog.${action.key}.confirm`,
    danger: !action.primary,
  };
  return action.needsReason
    ? confirm.askReason({
        ...dialog,
        reason: { label: 'condominiums.fields.statusReason', maxLength: 255 },
      })
    : confirm.confirm(dialog).pipe(map((ok) => (ok ? '' : null)));
}
