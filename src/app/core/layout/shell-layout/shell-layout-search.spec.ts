import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../../auth/auth-service';
import { TopbarSearch } from '../topbar-search';
import { ViewportService } from '../viewport-service';
import { ShellLayout } from './shell-layout';

@Component({ template: '' })
class Dummy {}

describe('ShellLayout - pesquisa da barra superior', () => {
  async function setup() {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'home', component: Dummy },
          { path: 'search', component: Dummy, data: { topbarSearch: true } },
        ]),
        {
          provide: AuthService,
          useValue: { user: signal({ id: '1', name: 'Ana', email: 'a@x.com', roles: [] }) },
        },
        { provide: ViewportService, useValue: { usesDrawer: () => false, isDesktop: () => true } },
      ],
    });
    const fixture = TestBed.createComponent(ShellLayout);
    await fixture.whenStable();
    const input = () => fixture.nativeElement.querySelector('#global-search') as HTMLInputElement;
    const type = async (value: string) => {
      input().value = value;
      input().dispatchEvent(new Event('input'));
      await fixture.whenStable();
    };
    const go = async (url: string) => {
      await TestBed.inject(Router).navigateByUrl(url);
      await fixture.whenStable();
    };
    return { type, go, term: TestBed.inject(TopbarSearch).term };
  }

  it('não alimenta o serviço em rotas sem topbarSearch (ex.: Home)', async () => {
    const { type, go, term } = await setup();
    await go('/home');
    await type('alpha');
    expect(term()).toBe('');
  });

  it('alimenta o serviço em rotas com topbarSearch', async () => {
    const { type, go, term } = await setup();
    await go('/search');
    await type('alpha');
    expect(term()).toBe('alpha');
  });
});
