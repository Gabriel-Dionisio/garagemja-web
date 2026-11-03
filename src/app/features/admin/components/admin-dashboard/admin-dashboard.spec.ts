import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { UsersApi } from '../../data/users-api';
import { User } from '../../user.model';
import { AdminDashboard } from './admin-dashboard';

const USER: User = {
  id: 'u1',
  name: 'Ana Souza',
  email: 'a***@x.com',
  phone: '(11) 98765-4321',
  cpf: '***.***.789-01',
  roles: ['CONDOMINIUM_ADMIN'],
  status: 'PENDING',
};

describe('AdminDashboard', () => {
  const summary = vi.fn();
  const list = vi.fn();

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: UsersApi, useValue: { summary, list } }],
    });
  });

  it('mostra contagens e listas de pendentes e recentes', async () => {
    summary.mockReturnValue(of({ total: 9, active: 5, pending: 3, blocked: 1 }));
    list.mockReturnValue(of({ items: [USER], page: 0, size: 5, hasNext: false }));
    const fixture = TestBed.createComponent(AdminDashboard);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(list).toHaveBeenCalledWith({ email: '', cpf: '', status: 'PENDING' }, 0, 5);
    expect(root.querySelectorAll('.kpi')).toHaveLength(4);
    expect(root.querySelector('.kpi.highlight')?.textContent).toContain('3');
    expect(root.textContent).toContain('Ana Souza');
    expect(root.querySelector('a[aria-label="Detalhes"]')).not.toBeNull();
  });

  it('mostra erro quando o carregamento falha', async () => {
    summary.mockReturnValue(throwError(() => new Error('falha')));
    list.mockReturnValue(of({ items: [], page: 0, size: 5, hasNext: false }));
    const fixture = TestBed.createComponent(AdminDashboard);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('app-alert')).not.toBeNull();
  });
});
