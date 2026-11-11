import { TestBed } from '@angular/core/testing';
import { provideTestTranslations } from '../../../../testing/translations';
import { JoinCodeCard } from './join-code-card';

vi.mock('qrcode', () => ({
  toDataURL: vi.fn(() => Promise.resolve('data:image/png;base64,AA==')),
}));

describe('JoinCodeCard', () => {
  const writeText = vi.fn(() => Promise.resolve());
  const share = vi.fn(() => Promise.resolve());

  async function setup(withShare: boolean) {
    Object.assign(navigator, { clipboard: { writeText }, share: withShare ? share : undefined });
    TestBed.configureTestingModule({ providers: [provideTestTranslations()] });
    const fixture = TestBed.createComponent(JoinCodeCard);
    fixture.componentRef.setInput('code', 'ABC234DEFG');
    fixture.componentRef.setInput('condominiumName', 'Solar');
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const button = (text: string) =>
      Array.from(element.querySelectorAll('button')).find((b) => b.textContent?.includes(text));
    return { fixture, element, button };
  }

  beforeEach(() => {
    writeText.mockClear();
    share.mockClear();
  });

  it('copia o código e o link de entrada', async () => {
    const { fixture, button } = await setup(false);
    button('Copiar código')?.click();
    expect(writeText).toHaveBeenCalledWith('ABC234DEFG');
    button('Copiar link')?.click();
    expect(writeText).toHaveBeenCalledWith(`${location.origin}/join/ABC234DEFG`);
    await fixture.whenStable();
  });

  it('mostra o QR code do link', async () => {
    const { element } = await setup(false);
    await vi.waitFor(() => expect(element.querySelector('img.qr')).not.toBeNull());
  });

  it('oferece compartilhar só quando o navegador suporta', async () => {
    const without = await setup(false);
    expect(without.button('Compartilhar')).toBeUndefined();
    TestBed.resetTestingModule();
    const withShare = await setup(true);
    withShare.button('Compartilhar')?.click();
    expect(share).toHaveBeenCalledWith({
      title: 'Solar',
      url: `${location.origin}/join/ABC234DEFG`,
    });
  });
});
