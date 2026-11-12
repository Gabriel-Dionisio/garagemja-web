import { TestBed } from '@angular/core/testing';
import { provideTransloco } from '@jsverse/transloco';
import { AccountPhoto } from './account-photo';

describe('AccountPhoto', () => {
  const profile = {
    id: '1',
    name: 'Ana Souza',
    email: 'a@x.com',
    phone: '',
    cpf: '',
    photoUrl: null as string | null,
  };

  async function setup(photoUrl: string | null = null) {
    TestBed.configureTestingModule({
      providers: [
        provideTransloco({ config: { availableLangs: ['pt-BR'], defaultLang: 'pt-BR' } }),
      ],
    });
    const fixture = TestBed.createComponent(AccountPhoto);
    fixture.componentRef.setInput('profile', { ...profile, photoUrl });
    fixture.componentRef.setInput('roles', ['RESIDENT']);
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  function pick(element: HTMLElement, file: File): void {
    const input = element.querySelector('input[type=file]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    input.dispatchEvent(new Event('change'));
  }

  it('mostra o botão de remover só quando há foto', async () => {
    expect((await setup()).element.querySelector('.remove')).toBeNull();
    TestBed.resetTestingModule();
    expect((await setup('http://cdn/x.webp')).element.querySelector('.remove')).not.toBeNull();
  });

  it('emite a imagem escolhida', async () => {
    const { fixture, element } = await setup();
    const emitted: File[] = [];
    fixture.componentInstance.selected.subscribe((file) => emitted.push(file));
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    pick(element, file);
    expect(emitted).toEqual([file]);
  });

  it('rejeita arquivo que não é imagem', async () => {
    const { fixture, element } = await setup();
    const emitted: File[] = [];
    fixture.componentInstance.selected.subscribe((file) => emitted.push(file));
    pick(element, new File(['x'], 'a.txt', { type: 'text/plain' }));
    await fixture.whenStable();
    expect(emitted).toEqual([]);
    expect(element.querySelector('[role=alert]')).not.toBeNull();
  });

  it('abre a foto inteira ao clicar nela', async () => {
    const { fixture, element } = await setup('http://cdn/x.webp');
    (element.querySelector('.view') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(document.querySelector('app-photo-viewer img')?.getAttribute('src')).toBe(
      'http://cdn/x.webp',
    );
  });

  it('sem foto não há o que ampliar', async () => {
    expect((await setup()).element.querySelector('.view')).toBeNull();
  });
});
