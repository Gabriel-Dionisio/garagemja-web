import { TestBed } from '@angular/core/testing';
import { TopbarSearch } from '../../../../core/layout/topbar-search';
import { provideTestTranslations } from '../../../../testing/translations';
import { SearchVacanciesPage } from './search-vacancies-page';

describe('SearchVacanciesPage', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideTestTranslations()] }));

  it('mostra o mapa ilustrativo e a mensagem de nenhuma vaga encontrada', async () => {
    const fixture = TestBed.createComponent(SearchVacanciesPage);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Nenhuma vaga encontrada');
    expect(element.querySelector('app-illustrative-map [role="img"]')).not.toBeNull();
    expect(element.querySelector('app-vacancy-card')).toBeNull();
  });

  it('limpa o termo da barra superior ao sair da tela', async () => {
    const term = TestBed.inject(TopbarSearch).term;
    const fixture = TestBed.createComponent(SearchVacanciesPage);
    await fixture.whenStable();
    term.set('alpha');
    fixture.destroy();
    expect(term()).toBe('');
  });
});
