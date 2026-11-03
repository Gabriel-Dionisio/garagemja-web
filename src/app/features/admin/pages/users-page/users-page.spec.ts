import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ConfirmService } from '../../../../shared/ui/confirm-dialog/confirm-service';
import { UsersApi } from '../../data/users-api';
import { User } from '../../user.model';
import { UsersPage } from './users-page';

const USER: User = {
  id: 'u1',
  name: 'Ana Souza',
  email: 'a***@x.com',
  phone: '(11) 98765-4321',
  cpf: '***.***.789-01',
  roles: ['CONDOMINIUM_ADMIN'],
  status: 'PENDING',
};

describe('UsersPage', () => {
  const list = vi.fn();
  const approve = vi.fn();

  beforeEach(() => {
    list.mockReset();
    approve.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: UsersApi, useValue: { list, approve } },
        { provide: ConfirmService, useValue: { confirm: () => of(true) } },
      ],
    });
  });

  it('lista usuários com perfil e status', async () => {
    list.mockReturnValue(of({ items: [USER], page: 0, size: 20, hasNext: false }));
    const fixture = TestBed.createComponent(UsersPage);
    await fixture.whenStable();
    const text = (fixture.nativeElement as HTMLElement).textContent;
    expect(list).toHaveBeenCalledWith({ email: '', cpf: '' }, 0, 20);
    expect(text).toContain('Ana Souza');
    expect(text).toContain('Síndico');
    expect(text).toContain('Pendente');
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('button[aria-label="Aprovar"]'),
    ).not.toBeNull();
  });

  it('mostra estado vazio sem resultados', async () => {
    list.mockReturnValue(of({ items: [], page: 0, size: 20, hasNext: false }));
    const fixture = TestBed.createComponent(UsersPage);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Nenhum usuário encontrado',
    );
  });

  it('aprova o síndico pendente ao confirmar', async () => {
    list.mockReturnValue(of({ items: [USER], page: 0, size: 20, hasNext: false }));
    approve.mockReturnValue(of({ ...USER, status: 'ACTIVE' }));
    const fixture = TestBed.createComponent(UsersPage);
    await fixture.whenStable();
    approveButton(fixture.nativeElement)?.click();
    await fixture.whenStable();
    expect(approve).toHaveBeenCalledWith('u1');
    expect(list).toHaveBeenCalledTimes(2);
  });

  it('não aprova quando o diálogo é cancelado', async () => {
    TestBed.overrideProvider(ConfirmService, { useValue: { confirm: () => of(false) } });
    list.mockReturnValue(of({ items: [USER], page: 0, size: 20, hasNext: false }));
    const fixture = TestBed.createComponent(UsersPage);
    await fixture.whenStable();
    approveButton(fixture.nativeElement)?.click();
    await fixture.whenStable();
    expect(approve).not.toHaveBeenCalled();
    expect(list).toHaveBeenCalledTimes(1);
  });

  it('mostra erro e para de carregar quando a listagem falha', async () => {
    list.mockReturnValue(throwError(() => new Error('falha')));
    const fixture = TestBed.createComponent(UsersPage);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('app-alert')).not.toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelector('app-loading-block')).toBeNull();
  });
});

function approveButton(root: HTMLElement): HTMLButtonElement | null {
  return root.querySelector('button[aria-label="Aprovar"]');
}
