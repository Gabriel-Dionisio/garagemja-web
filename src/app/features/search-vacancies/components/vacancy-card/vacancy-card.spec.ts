import { TestBed } from '@angular/core/testing';
import { provideTestTranslations } from '../../../../testing/translations';
import { DEFAULT_PARKING_SPACE_IMAGE, Vacancy } from '../../search-vacancies.model';
import { VacancyCard } from './vacancy-card';

const base: Vacancy = {
  id: '1',
  number: '23',
  block: 'Bloco A',
  condominiumName: 'Residencial Alpha',
  size: 'MEDIUM',
  price: 8,
  priceUnit: 'HOUR',
  available: true,
  imageUrl: 'https://cdn.example.com/vaga.jpg',
};

async function render(vacancy: Vacancy) {
  TestBed.configureTestingModule({ providers: [provideTestTranslations()] });
  const fixture = TestBed.createComponent(VacancyCard);
  fixture.componentRef.setInput('vacancy', vacancy);
  await fixture.whenStable();
  const img = () => fixture.nativeElement.querySelector('img') as HTMLImageElement;
  return { fixture, img };
}

describe('VacancyCard', () => {
  it('mostra identificação, condomínio, tamanho, preço e disponibilidade', async () => {
    const { fixture } = await render(base);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Vaga 23 - Bloco A');
    expect(text).toContain('Residencial Alpha');
    expect(text).toContain('Média');
    expect(text).toContain('R$ 8,00');
    expect(text).toContain('/hora');
    expect(text).toContain('Disponível');
  });

  it('omite bloco, tamanho e preço quando não informados', async () => {
    const { fixture } = await render({ ...base, block: null, size: null, price: null, priceUnit: null });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Vaga 23');
    expect(text).not.toContain('Bloco A');
    expect(text).not.toContain('R$');
  });

  it('usa a imagem própria quando válida', async () => {
    const { img } = await render(base);
    expect(img().getAttribute('src')).toBe(base.imageUrl);
  });

  it.each([null, '', '   ', 'javascript:alert(1)', '//evil.test/x.png'])(
    'usa a imagem padrão quando a url é %j',
    async (imageUrl) => {
      const { img } = await render({ ...base, imageUrl });
      expect(img().getAttribute('src')).toBe(DEFAULT_PARKING_SPACE_IMAGE);
    },
  );

  it('troca pela imagem padrão quando a imagem própria falha', async () => {
    const { fixture, img } = await render(base);
    img().dispatchEvent(new Event('error'));
    await fixture.whenStable();
    expect(img().getAttribute('src')).toBe(DEFAULT_PARKING_SPACE_IMAGE);
  });

  it('não entra em loop se a própria imagem padrão falhar', async () => {
    const { fixture, img } = await render({ ...base, imageUrl: null });
    img().dispatchEvent(new Event('error'));
    img().dispatchEvent(new Event('error'));
    await fixture.whenStable();
    expect(img().getAttribute('src')).toBe(DEFAULT_PARKING_SPACE_IMAGE);
  });

  it('volta a tentar a imagem própria ao trocar de vaga', async () => {
    const { fixture, img } = await render(base);
    img().dispatchEvent(new Event('error'));
    await fixture.whenStable();
    fixture.componentRef.setInput('vacancy', { ...base, id: '2', imageUrl: 'https://cdn.example.com/outra.jpg' });
    await fixture.whenStable();
    expect(img().getAttribute('src')).toBe('https://cdn.example.com/outra.jpg');
  });
});
