import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth-service';
import { ConfirmService } from '../../../../shared/ui/confirm-dialog/confirm-service';
import { UsersApi } from '../../data/users-api';
import { User } from '../../user.model';
import { UserDetailPage } from './user-detail-page';

const USER: User = {
  id: 'u1',
  name: 'Ana Souza',
  email: 'ana@x.com',
  phone: '11987654321',
  cpf: null,
  roles: ['CONDOMINIUM_ADMIN', 'RESIDENT'],
  status: 'ACTIVE',
};

describe('UserDetailPage', () => {
  const update = vi.fn();

  beforeEach(() => {
    update.mockReset().mockReturnValue(of(USER));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: UsersApi, useValue: { get: () => of(USER), update } },
        { provide: AuthService, useValue: { user: signal({ id: 'admin' }) } },
        { provide: ConfirmService, useValue: { confirm: () => of(true) } },
      ],
    });
  });

  it('mostra os perfis só para leitura e salva sem enviar perfis', async () => {
    const fixture = TestBed.createComponent(UserDetailPage);
    fixture.componentRef.setInput('id', 'u1');
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('dl')?.textContent).toContain('Síndico');
    expect(host.querySelector('app-chip-toggle, fieldset')).toBeNull();

    host.querySelector<HTMLFormElement>('form')?.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    expect(update).toHaveBeenCalledWith('u1', { name: 'Ana Souza', phone: '11987654321' });
  });
});
