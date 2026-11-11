import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth-service';
import { EntityLookup } from '../../../../shared/lookup/entity-lookup';
import { AuditLogsApi } from '../../data/audit-logs-api';
import { AuditLogsPage } from './audit-logs-page';

const emptyPage = { items: [], page: 0, size: 25, hasNext: false, total: 0 };

describe('AuditLogsPage', () => {
  const list = vi.fn();
  const getUser = vi.fn();
  const getCondominium = vi.fn();

  async function setup(query: Record<string, string>, admin = true) {
    list.mockReset().mockReturnValue(of(emptyPage));
    getUser.mockReset().mockReturnValue(of({ id: 'u1', label: 'Maria Souza', detail: 'm@x.com' }));
    getCondominium.mockReset().mockReturnValue(of({ id: 'c1', label: 'Solar' }));
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: { hasRole: (role: string) => admin && role === 'ADMIN' },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({}), queryParamMap: convertToParamMap(query) },
          },
        },
        { provide: AuditLogsApi, useValue: { list, exportUrl: () => '/export' } },
        {
          provide: EntityLookup,
          useValue: { user: getUser, condominium: getCondominium, searchUsers: vi.fn() },
        },
      ],
    });
    const fixture = TestBed.createComponent(AuditLogsPage);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('prefills author, condominium and period from the link and shows their names', async () => {
    const element = await setup({
      userId: 'u1',
      condominiumId: 'c1',
      createdFrom: '2026-11-01T00:00:00.000Z',
    });
    expect(getUser).toHaveBeenCalledWith('u1');
    expect(getCondominium).toHaveBeenCalledWith('c1');
    const [filter] = list.mock.lastCall as [Record<string, string>];
    expect(filter['userId']).toBe('u1');
    expect(filter['condominiumId']).toBe('c1');
    expect(filter['createdFrom']).toContain('2026-11-0');
    expect(element.textContent).toContain('Maria Souza');
    expect(element.textContent).toContain('Solar');
  });

  it('hides the author filter and ignores it for a manager', async () => {
    const element = await setup({ userId: 'u1' }, false);
    const [filter] = list.mock.lastCall as [Record<string, string | undefined>];
    expect(filter['userId']).toBeUndefined();
    expect(element.textContent).not.toContain('Autor');
  });

  it('does not look anything up when the link has no filters', async () => {
    await setup({});
    expect(getUser).not.toHaveBeenCalled();
    expect(getCondominium).not.toHaveBeenCalled();
  });

  it('shows the browser time zone next to the date filters', async () => {
    const element = await setup({});
    expect(element.querySelector('.time-zone')?.textContent).toMatch(
      /Datas no fuso.*UTC[+−]\d{2}:\d{2}/,
    );
  });
});
