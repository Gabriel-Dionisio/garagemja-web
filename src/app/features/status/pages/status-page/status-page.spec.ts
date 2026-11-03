import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideTestTranslations } from '../../../../testing/translations';
import { StatusApi } from '../../data/status-api';
import { StatusPage } from './status-page';

describe('StatusPage', () => {
  it('mostra o estado e a versão da API', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideTestTranslations(),
        {
          provide: StatusApi,
          useValue: {
            load: () =>
              of({
                state: 'up',
                version: '1.2.3',
                latencyMs: 42,
                components: [{ name: 'database', up: true }],
                checkedAt: new Date(),
              }),
            history: () =>
              of({
                bucketMinutes: 30,
                uptimePercent: 99.5,
                buckets: [
                  { start: new Date(0), state: 'up' },
                  { start: new Date(1800000), state: 'down' },
                ],
              }),
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(StatusPage);
    await fixture.whenStable();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('v1.2.3');
    expect(text).toContain('42 ms');
    expect(fixture.nativeElement.querySelectorAll('.bars span').length).toBe(2);
    expect(text).toContain('99,5%');
    expect(fixture.nativeElement.querySelector('.card')?.getAttribute('data-state')).toBe('up');
  });

  it('mostra fora do ar quando a API está inalcançável', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideTestTranslations(),
        {
          provide: StatusApi,
          useValue: {
            load: () =>
              of({
                state: 'unreachable',
                version: null,
                components: [],
                latencyMs: null,
                checkedAt: new Date(),
              }),
            history: () => of(null),
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(StatusPage);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.card')?.getAttribute('data-state')).toBe('unreachable');
    expect(root.querySelector('.bars')).toBeNull();
    expect(root.textContent).toContain('Fora do ar');
  });
});
