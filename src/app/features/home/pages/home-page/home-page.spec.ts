import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth-service';
import { toPage } from '../../../../shared/models/page';
import { ParkingSpotsApi } from '../../../parking-spots/data/parking-spots-api';
import { HomeApi } from '../../data/home-api';
import { HomePage } from './home-page';

describe('HomePage', () => {
  async function setup(residencies: number, manager: boolean) {
    const search = vi.fn().mockReturnValue(of(toPage([], 0, 12, 0)));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: HomeApi, useValue: { residencyCount: () => of(residencies) } },
        { provide: ParkingSpotsApi, useValue: { search } },
        { provide: AuthService, useValue: { hasRole: () => manager } },
      ],
    });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(HomePage);
    await fixture.whenStable();
    return { navigate, search, fixture };
  }

  it('sends an account without any link to the welcome cards', async () => {
    const { navigate } = await setup(0, false);
    expect(navigate).toHaveBeenCalledWith(['/condominiums'], { replaceUrl: true });
  });

  it('keeps a manager without residency on the home', async () => {
    expect((await setup(0, true)).navigate).not.toHaveBeenCalled();
  });

  it('lists the first page of available spots for a resident', async () => {
    const { navigate, search } = await setup(2, false);
    expect(navigate).not.toHaveBeenCalled();
    expect(search).toHaveBeenCalledWith(expect.objectContaining({ sort: 'NUMBER' }), 0, 12);
  });

  it('sends the typed search and period to the vacancy search', async () => {
    const { navigate, fixture } = await setup(2, false);
    const element = fixture.nativeElement as HTMLElement;
    const input = element.querySelector<HTMLInputElement>('app-text-field input');
    input!.value = ' sol ';
    input!.dispatchEvent(new Event('input'));
    element.querySelector<HTMLFormElement>('form.search-panel')!.dispatchEvent(new Event('submit'));
    expect(navigate).toHaveBeenCalledWith(['/search'], {
      queryParams: expect.objectContaining({ q: 'sol', from: null }),
    });
  });
});
