import { Injectable, signal } from '@angular/core';

export interface TabbedCondominium {
  id: string;
  name: string;
  status: string;
  canManage: boolean;
}

export interface TabAccess {
  visible: boolean;
  residents: boolean;
  managers: boolean;
  history: boolean;
}

@Injectable({ providedIn: 'root' })
export class CondominiumTabsState {
  private readonly source = signal<{ condominium: TabbedCondominium; admin: boolean } | null>(null);

  readonly current = this.source.asReadonly();

  set(condominium: TabbedCondominium, admin: boolean): void {
    const { id, name, status, canManage } = condominium;
    this.source.set({ condominium: { id, name, status, canManage }, admin });
  }

  nameOf(id: string): string {
    const known = this.source()?.condominium;
    return known?.id === id ? known.name : '';
  }

  clear(): void {
    this.source.set(null);
  }
}

export function tabAccess(condominium: TabbedCondominium, admin: boolean): TabAccess {
  const open = condominium.status === 'ACTIVE' || condominium.status === 'BLOCKED';
  const manage = admin || condominium.canManage;
  return {
    visible: manage,
    residents: open && !admin && condominium.canManage,
    managers: open && manage,
    history: condominium.status !== 'PENDING',
  };
}
