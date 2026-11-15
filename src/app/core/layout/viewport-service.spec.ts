import { BreakpointObserver } from '@angular/cdk/layout';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { BREAKPOINTS, ViewportService } from './viewport-service';

function setup(tablet: boolean): ViewportService {
  TestBed.configureTestingModule({
    providers: [
      {
        provide: BreakpointObserver,
        useValue: {
          observe: () => of({ matches: tablet, breakpoints: { [BREAKPOINTS.tablet]: tablet } }),
          isMatched: () => tablet,
        },
      },
    ],
  });
  return TestBed.inject(ViewportService);
}

describe('ViewportService', () => {
  it('uses the drawer on phones', () => {
    expect(setup(false).usesDrawer()).toBe(true);
  });

  it('uses the collapsed sidebar from tablet up, on any monitor width', () => {
    expect(setup(true).usesDrawer()).toBe(false);
  });
});
