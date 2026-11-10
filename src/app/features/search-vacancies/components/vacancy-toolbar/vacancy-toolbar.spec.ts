import { TestBed } from '@angular/core/testing';
import { provideTestTranslations } from '../../../../testing/translations';
import { DEFAULT_CRITERIA, VacancyCriteria } from '../../search-vacancies.model';
import { VacancyToolbar } from './vacancy-toolbar';

describe('VacancyToolbar', () => {
  async function setup(count: number, criteria: VacancyCriteria = DEFAULT_CRITERIA) {
    TestBed.configureTestingModule({ providers: [provideTestTranslations()] });
    const fixture = TestBed.createComponent(VacancyToolbar);
    fixture.componentRef.setInput('count', count);
    fixture.componentRef.setInput('criteria', criteria);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const select = (name: string) => el.querySelector(`select[aria-label="${name}"]`) as HTMLSelectElement;
    const choose = async (name: string, value: string) => {
      const target = select(name);
      target.value = value;
      target.dispatchEvent(new Event('change'));
      await fixture.whenStable();
    };
    return { fixture, el, select, choose };
  }

  it('mostra a quantidade no singular', async () => {
    expect((await setup(1)).el.textContent).toContain('1 vaga encontrada');
  });

  it('mostra a quantidade no plural', async () => {
    expect((await setup(12)).el.textContent).toContain('12 vagas encontradas');
  });

  it('oferece ordenação, disponibilidade e tamanho com os valores reais', async () => {
    const { select } = await setup(3);
    const labels = (name: string) => Array.from(select(name).options).map((o) => o.text.trim());
    expect(labels('Ordenar por')).toEqual(['Menor preço', 'Maior preço']);
    expect(labels('Disponibilidade')).toEqual(['Todas', 'Disponíveis', 'Indisponíveis']);
    expect(labels('Tamanho')).toEqual(['Todos os tamanhos', 'Pequena', 'Média', 'Grande']);
    expect(Array.from(select('Tamanho').options).map((o) => o.value)).toEqual([
      'ALL',
      'SMALL',
      'MEDIUM',
      'LARGE',
    ]);
  });

  it('não oferece filtro de cobertura (a API não tem esse dado)', async () => {
    const { el } = await setup(3);
    expect(el.textContent).not.toMatch(/coberta|descoberta/i);
  });

  it('altera um critério preservando os demais', async () => {
    const { fixture, choose } = await setup(3, { ...DEFAULT_CRITERIA, availability: 'AVAILABLE' });
    await choose('Tamanho', 'LARGE');
    await choose('Ordenar por', 'PRICE_DESC');
    expect(fixture.componentInstance.criteria()).toEqual({
      availability: 'AVAILABLE',
      size: 'LARGE',
      sort: 'PRICE_DESC',
    });
  });

  it('não mostra "Limpar filtros" quando só a ordenação foi alterada', async () => {
    const { el } = await setup(3, { ...DEFAULT_CRITERIA, sort: 'PRICE_DESC' });
    expect(el.querySelector('.clear')).toBeNull();
  });

  it('mostra "Limpar filtros" com filtro ativo e emite ao clicar', async () => {
    const { fixture, el } = await setup(3, { ...DEFAULT_CRITERIA, size: 'SMALL' });
    let cleared = 0;
    fixture.componentInstance.cleared.subscribe(() => cleared++);
    (el.querySelector('.clear') as HTMLButtonElement).click();
    expect(cleared).toBe(1);
  });
});
