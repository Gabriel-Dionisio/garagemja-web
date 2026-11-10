import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TopbarSearch } from '../../../../core/layout/topbar-search';
import { provideTestTranslations } from '../../../../testing/translations';
import { SearchVacanciesPage } from './search-vacancies-page';

const condominium = (id: string, name: string, address: string) => ({
  id,
  name,
  address,
  city: 'Campinas',
  state: 'SP',
});
const spot = (id: string, condominiumId: string, size: string | null) => ({
  id,
  condominiumId,
  number: id,
  location: null,
  size,
});
const availability = (parkingSpotId: string, price: string) => ({
  parkingSpotId,
  price,
  startDate: '2000-01-01',
  endDate: '2999-12-31',
  active: true,
});

const SPOTS = [spot('1', 'a', 'MEDIUM'), spot('2', 'a', 'LARGE'), spot('3', 'b', 'SMALL')];
const CONDOMINIUMS = [condominium('a', 'Residencial Alpha', 'Rua A'), condominium('b', 'Edifício Beta', 'Av. B')];
const AVAILABILITIES = [availability('1', '8.00'), availability('2', '12.00')];

describe('SearchVacanciesPage', () => {
  let http: HttpTestingController;
  let fixture: ComponentFixture<SearchVacanciesPage>;
  let element: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideTestTranslations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(SearchVacanciesPage);
    element = fixture.nativeElement as HTMLElement;
  });

  afterEach(() => {
    vi.useRealTimers();
    http.verify();
  });

  async function settle() {
    fixture.detectChanges();
    await fixture.whenStable();
  }

  async function load(spots: unknown[] = SPOTS, availabilities: unknown[] = AVAILABILITIES) {
    await settle();
    http.expectOne((r) => r.url === '/api/v1/parking-spots').flush(spots);
    http.expectOne('/api/v1/condominiums').flush(CONDOMINIUMS);
    http.expectOne((r) => r.url === '/api/v1/spot-availabilities').flush(availabilities);
    await settle();
  }

  const titles = () =>
    Array.from(element.querySelectorAll('app-vacancy-card h2')).map((h) => h.textContent?.trim());
  const text = () => element.textContent ?? '';

  async function choose(name: string, value: string) {
    const select = element.querySelector(`select[aria-label="${name}"]`) as HTMLSelectElement;
    select.value = value;
    select.dispatchEvent(new Event('change'));
    await settle();
  }

  it('mostra o carregamento e depois as vagas, ordenadas por menor preço', async () => {
    await settle();
    expect(element.querySelector('app-loading-block')).not.toBeNull();
    expect(element.querySelector('app-vacancy-toolbar')).toBeNull();

    await load();
    expect(element.querySelector('app-loading-block')).toBeNull();
    expect(text()).toContain('3 vagas encontradas');
    expect(titles()).toEqual(['Vaga 1', 'Vaga 2', 'Vaga 3']);
  });

  it('reordena por maior preço sem perder os filtros', async () => {
    await load();
    await choose('Ordenar por', 'PRICE_DESC');
    expect(titles()).toEqual(['Vaga 2', 'Vaga 1', 'Vaga 3']);

    await choose('Disponibilidade', 'AVAILABLE');
    expect(titles()).toEqual(['Vaga 2', 'Vaga 1']);
    expect(text()).toContain('2 vagas encontradas');
  });

  it('combina disponibilidade e tamanho e atualiza a contagem', async () => {
    await load();
    await choose('Disponibilidade', 'AVAILABLE');
    await choose('Tamanho', 'LARGE');
    expect(titles()).toEqual(['Vaga 2']);
    expect(text()).toContain('1 vaga encontrada');

    await choose('Disponibilidade', 'UNAVAILABLE');
    expect(titles()).toEqual([]);
    expect(text()).toContain('Nenhuma vaga encontrada');
  });

  it('aplica a pesquisa da barra superior com debounce, junto com os filtros', async () => {
    vi.useFakeTimers();
    await load();
    const term = TestBed.inject(TopbarSearch).term;

    term.set('beta');
    TestBed.tick();
    await vi.advanceTimersByTimeAsync(100);
    await settle();
    expect(titles()).toHaveLength(3); // ainda dentro do debounce

    await vi.advanceTimersByTimeAsync(300);
    await settle();
    expect(titles()).toEqual(['Vaga 3']);

    await choose('Tamanho', 'LARGE');
    expect(titles()).toEqual([]);
  });

  it('mostra "nenhum resultado" com opção de limpar, que restaura filtros e pesquisa', async () => {
    await load();
    await choose('Tamanho', 'SMALL');
    await choose('Disponibilidade', 'AVAILABLE');
    expect(text()).toContain('Nenhuma vaga corresponde à pesquisa ou aos filtros');

    const term = TestBed.inject(TopbarSearch).term;
    term.set('x');
    (element.querySelector('app-empty-state button') as HTMLButtonElement).click();
    await settle();
    expect(term()).toBe('');
    expect(titles()).toEqual(['Vaga 1', 'Vaga 2', 'Vaga 3']);
    expect((element.querySelector('select[aria-label="Tamanho"]') as HTMLSelectElement).value).toBe('ALL');
  });

  it('mantém a ordenação escolhida ao limpar os filtros', async () => {
    await load();
    await choose('Ordenar por', 'PRICE_DESC');
    await choose('Tamanho', 'SMALL');
    (element.querySelector('.clear') as HTMLButtonElement).click();
    await settle();
    expect(titles()).toEqual(['Vaga 2', 'Vaga 1', 'Vaga 3']);
  });

  it('diferencia a ausência de vagas de erro e não oferece limpar sem filtros', async () => {
    await load([], []);
    expect(text()).toContain('Nenhuma vaga encontrada');
    expect(text()).toContain('Ainda não há vagas disponíveis para você');
    expect(element.querySelector('app-empty-state button')).toBeNull();
    expect(element.querySelector('app-alert')).toBeNull();
  });

  it('mostra erro de carregamento e permite tentar novamente', async () => {
    await settle();
    http
      .expectOne((r) => r.url === '/api/v1/parking-spots')
      .flush(null, { status: 500, statusText: 'Server Error' });
    http.match(() => true);
    await settle();
    expect(element.querySelector('app-alert')?.textContent).toContain('Não foi possível carregar as vagas');
    expect(text()).not.toContain('Nenhuma vaga encontrada');

    (element.querySelector('.retry') as HTMLButtonElement).click();
    await settle();
    expect(element.querySelector('app-loading-block')).not.toBeNull();
    http.expectOne((r) => r.url === '/api/v1/parking-spots').flush(SPOTS);
    http.expectOne('/api/v1/condominiums').flush(CONDOMINIUMS);
    http.expectOne((r) => r.url === '/api/v1/spot-availabilities').flush(AVAILABILITIES);
    await settle();
    expect(titles()).toHaveLength(3);
  });

  it('exibe o mapa ilustrativo com marcadores decorativos fixos, que não acompanham os resultados', async () => {
    await load();
    const pins = () => element.querySelectorAll('app-illustrative-map .pin').length;
    expect(element.querySelector('app-illustrative-map [role="img"]')).not.toBeNull();
    const initial = pins();
    expect(initial).toBeGreaterThan(0);

    await choose('Tamanho', 'SMALL');
    expect(titles()).toEqual(['Vaga 3']);
    expect(pins()).toBe(initial);
  });

  it('limpa o termo da barra superior ao sair da tela', async () => {
    await load();
    const term = TestBed.inject(TopbarSearch).term;
    term.set('alpha');
    fixture.destroy();
    expect(term()).toBe('');
  });
});
