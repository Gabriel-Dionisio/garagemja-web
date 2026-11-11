import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth-service';
import { HomeApi } from '../../data/home-api';
import { HomePage } from './home-page';

describe('HomePage', () => {
  async function setup(residencies: number, manager: boolean) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: HomeApi, useValue: { loadMine: () => of({ residencies, condominiums: [] }) } },
        { provide: AuthService, useValue: { hasRole: () => manager } },
      ],
    });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(HomePage);
    await fixture.whenStable();
    return navigate;
  }

  it('sends an account without any link to the welcome cards', async () => {
    const navigate = await setup(0, false);
    expect(navigate).toHaveBeenCalledWith(['/condominiums'], { replaceUrl: true });
  });

  it('keeps a manager without residency on the home', async () => {
    expect(await setup(0, true)).not.toHaveBeenCalled();
  });

  it('keeps a resident with a link on the home', async () => {
    expect(await setup(2, false)).not.toHaveBeenCalled();
  });
});
