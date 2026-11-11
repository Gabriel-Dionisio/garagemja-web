import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth-service';
import { Condominium, CondominiumStatus } from '../../condominium.model';
import { CondominiumsApi } from '../../data/condominiums-api';
import { ConfirmService } from '../../../../shared/ui/confirm-dialog/confirm-service';
import { CondominiumFormPage } from './condominium-form-page';

const condominium = (status: CondominiumStatus, canManage = true): Condominium => ({
  id: 'c1',
  name: 'Edifício A',
  cnpj: '11222333000181',
  address: null,
  district: null,
  number: null,
  city: null,
  state: null,
  zipCode: null,
  status,
  statusReason: null,
  requestedBy: 'u1',
  canManage,
  resides: false,
  residency: null,
  contacts: [],
  createdAt: '2026-11-01T10:00:00Z',
  imageUrl: null,
  thumbnailUrl: null,
});

describe('CondominiumFormPage', () => {
  const update = vi.fn();
  const askReason = vi.fn();

  async function setup(item: Condominium, admin = false) {
    update.mockReset();
    askReason.mockReset().mockReturnValue(of(null));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ConfirmService, useValue: { askReason, confirm: () => of(false) } },
        { provide: AuthService, useValue: { hasRole: () => admin, user: () => ({ id: 'u1' }) } },
        {
          provide: CondominiumsApi,
          useValue: {
            get: () => of(item),
            images: () => of([]),
            counts: () => of({ residents: 12, parkingSpots: 7, activeRentals: 3 }),
            update,
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(CondominiumFormPage);
    fixture.componentRef.setInput('id', item.id);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const button = (label: string) =>
      Array.from(element.querySelectorAll('button')).find((b) => b.textContent?.includes(label));
    return { element, button, fixture };
  }

  it.each(['PENDING', 'REJECTED'] as const)(
    'lets the requester delete a %s request',
    async (status) => {
      const { button } = await setup(condominium(status));
      expect(button('Excluir condomínio')).toBeTruthy();
    },
  );

  it.each(['ACTIVE', 'BLOCKED', 'CLOSED'] as const)(
    'never offers delete for a %s condominium',
    async (status) => {
      const { button } = await setup(condominium(status), true);
      expect(button('Excluir condomínio')).toBeUndefined();
    },
  );

  it('asks for a reason in a dialog before closing and does not call the API if cancelled', async () => {
    const { button, fixture } = await setup(condominium('ACTIVE'), true);
    button('Encerrar')?.click();
    await fixture.whenStable();
    expect(askReason).toHaveBeenCalledOnce();
    expect(update).not.toHaveBeenCalled();
  });

  it('shows the counts to the admin but hides the residents link', async () => {
    const { element } = await setup(condominium('ACTIVE', false), true);
    expect(element.querySelector('.counts')?.textContent).toContain('12');
    expect(element.querySelector('a[href="/condominiums/c1/residents"]')).toBeNull();
  });

  it('shows the history tab of a REJECTED request', async () => {
    const { element } = await setup(condominium('REJECTED'));
    expect(element.querySelector('a[href="/condominiums/c1/history"]')).not.toBeNull();
  });

  it('hides the history tab of a PENDING request', async () => {
    const { element } = await setup(condominium('PENDING'));
    expect(element.querySelector('a[href="/condominiums/c1/history"]')).toBeNull();
  });

  it('does not offer save when the API says the user cannot manage', async () => {
    const { button } = await setup(condominium('ACTIVE', false), true);
    expect(button('Salvar')).toBeUndefined();
  });

  it('offers to join as resident an active condominium found by CNPJ', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ConfirmService, useValue: { askReason, confirm: () => of(false) } },
        { provide: AuthService, useValue: { hasRole: () => false, user: () => ({ id: 'u1' }) } },
        { provide: CondominiumsApi, useValue: { findByCnpj: () => of(condominium('ACTIVE')) } },
      ],
    });
    const fixture = TestBed.createComponent(CondominiumFormPage);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const input = element.querySelector('input')!;
    input.value = '11222333000181';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(element.textContent).toContain('Entrar como morador');
  });

  it('avisa quando o CNPJ digitado já está cadastrado', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ConfirmService, useValue: { askReason, confirm: () => of(false) } },
        { provide: AuthService, useValue: { hasRole: () => false, user: () => ({ id: 'u1' }) } },
        {
          provide: CondominiumsApi,
          useValue: { findByCnpj: () => of(condominium('ACTIVE')) },
        },
      ],
    });
    const fixture = TestBed.createComponent(CondominiumFormPage);
    await fixture.whenStable();
    const input = (fixture.nativeElement as HTMLElement).querySelector('input')!;
    input.value = '11222333000181';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('já está cadastrado');
  });

  it('pede para ser síndico de um condomínio ativo já cadastrado', async () => {
    const requestManagement = vi.fn().mockReturnValue(of(undefined));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ConfirmService, useValue: { askReason, confirm: () => of(false) } },
        { provide: AuthService, useValue: { hasRole: () => false, user: () => ({ id: 'u1' }) } },
        {
          provide: CondominiumsApi,
          useValue: { findByCnpj: () => of(condominium('ACTIVE')), requestManagement },
        },
      ],
    });
    const fixture = TestBed.createComponent(CondominiumFormPage);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const input = element.querySelector('input')!;
    input.value = '11222333000181';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    Array.from(element.querySelectorAll('button'))
      .find((b) => b.textContent?.includes('Sou o novo síndico'))!
      .click();
    await fixture.whenStable();
    expect(requestManagement).toHaveBeenCalledWith('c1');
    expect(element.textContent).toContain('Pedido enviado');
  });
});
