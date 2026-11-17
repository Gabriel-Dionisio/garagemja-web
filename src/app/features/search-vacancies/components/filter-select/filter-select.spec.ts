import { TestBed } from '@angular/core/testing';
import { provideTestTranslations } from '../../../../testing/translations';
import { FilterOption, FilterSelect } from './filter-select';

type Size = 'ALL' | 'SMALL';
const OPTIONS: readonly FilterOption<Size>[] = [
  { value: 'ALL', labelKey: 'searchVacancies.filters.size.ALL' },
  { value: 'SMALL', labelKey: 'searchVacancies.filters.size.SMALL' },
];

describe('FilterSelect', () => {
  async function setup(value: Size) {
    TestBed.configureTestingModule({ providers: [provideTestTranslations()] });
    const fixture = TestBed.createComponent<FilterSelect<Size>>(FilterSelect);
    fixture.componentRef.setInput('label', 'Tamanho');
    fixture.componentRef.setInput('options', OPTIONS);
    fixture.componentRef.setInput('value', value);
    await fixture.whenStable();
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    return { fixture, select };
  }

  it('mostra as opções traduzidas, a atual selecionada e o nome acessível', async () => {
    const { select } = await setup('SMALL');
    expect(select.getAttribute('aria-label')).toBe('Tamanho');
    expect(Array.from(select.options).map((option) => option.text.trim())).toEqual([
      'Todos os tamanhos',
      'Pequena',
    ]);
    expect(select.value).toBe('SMALL');
  });

  it('atualiza o valor ao escolher uma opção', async () => {
    const { fixture, select } = await setup('ALL');
    select.value = 'SMALL';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(fixture.componentInstance.value()).toBe('SMALL');
  });

  it('ignora valores que não são opções', async () => {
    const { fixture, select } = await setup('ALL');
    const option = document.createElement('option');
    option.value = 'HACK';
    select.append(option);
    select.value = 'HACK';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(fixture.componentInstance.value()).toBe('ALL');
  });
});
