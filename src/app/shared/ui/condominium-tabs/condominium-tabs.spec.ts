import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTransloco } from '@jsverse/transloco';
import { CondominiumTabs } from './condominium-tabs';
import { CondominiumTabsState } from './condominium-tabs-state';

describe('CondominiumTabs', () => {
  function render(loading: boolean) {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideTransloco({ config: { availableLangs: ['pt-BR'] } })],
    });
    const fixture = TestBed.createComponent(CondominiumTabs);
    fixture.componentRef.setInput('id', 'c1');
    fixture.componentRef.setInput('loading', loading);
    return fixture;
  }

  it('mostra o esqueleto das abas enquanto carrega e o condomínio não é conhecido', async () => {
    const fixture = render(true);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('app-skeleton-block')).not.toBeNull();
    expect(root.querySelector('nav')).toBeNull();
  });

  it('mantém as abas durante o carregamento quando o condomínio já é conhecido', async () => {
    const fixture = render(true);
    TestBed.inject(CondominiumTabsState).set(
      { id: 'c1', name: 'Alfa', status: 'ACTIVE', canManage: true },
      false,
    );
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('app-skeleton-block')).toBeNull();
    expect(root.querySelectorAll('nav a').length).toBe(4);
  });

  it('esconde as abas de quem não gerencia o condomínio', async () => {
    const fixture = render(false);
    TestBed.inject(CondominiumTabsState).set(
      { id: 'c1', name: 'Alfa', status: 'ACTIVE', canManage: false },
      false,
    );
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('nav')).toBeNull();
  });
});
