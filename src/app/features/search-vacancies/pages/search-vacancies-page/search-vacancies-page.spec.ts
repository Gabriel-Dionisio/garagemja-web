import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { toPage } from '../../../../shared/models/page';
import { ParkingSpotsApi } from '../../../parking-spots/data/parking-spots-api';
import { SearchVacanciesPage } from './search-vacancies-page';

describe('SearchVacanciesPage', () => {
  async function setup(url: string, search = vi.fn().mockReturnValue(of(toPage([], 0, 12, 0)))) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'search-vacancies', component: SearchVacanciesPage }]),
        { provide: ParkingSpotsApi, useValue: { search } },
      ],
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    await harness.fixture.whenStable();
    return { search, root: harness.routeNativeElement as HTMLElement };
  }

  it('searches with the criteria and page from the URL', async () => {
    const { search } = await setup('/search-vacancies?q=A12&sort=PRICE_ASC');
    expect(search).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'A12', sort: 'PRICE_ASC' }),
      0,
      12,
    );
  });

  it('starts with the default criteria and no filter counted', async () => {
    const { search, root } = await setup('/search-vacancies');
    expect(search).toHaveBeenCalledWith(
      expect.objectContaining({ search: '', sort: 'NUMBER', hourly: false }),
      0,
      12,
    );
    expect(root.querySelector('app-filter-panel')).not.toBeNull();
  });

  it('shows an error alert when the search fails', async () => {
    const { root } = await setup(
      '/search-vacancies',
      vi.fn().mockReturnValue(throwError(() => new Error('boom'))),
    );
    expect(root.querySelector('app-alert')).not.toBeNull();
  });
});
