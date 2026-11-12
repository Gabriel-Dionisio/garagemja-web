import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { provideTestTranslations } from '../../../../testing/translations';
import { CondominiumsApi } from '../../data/condominiums-api';
import { JoinPanel } from './join-panel';

describe('JoinPanel', () => {
  const previewJoin = vi.fn();
  const join = vi.fn();
  const joinByCnpj = vi.fn();
  const lookup = vi.fn();

  const fill = (element: HTMLElement, index: number, value: string) => {
    const input = element.querySelectorAll('input')[index];
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };

  async function setup(code?: string, inputs: Record<string, string> = {}) {
    TestBed.configureTestingModule({
      providers: [
        provideTestTranslations(),
        { provide: CondominiumsApi, useValue: { previewJoin, join, joinByCnpj, lookup } },
      ],
    });
    const fixture = TestBed.createComponent(JoinPanel);
    if (code) fixture.componentRef.setInput('code', code);
    for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  beforeEach(() => {
    previewJoin
      .mockReset()
      .mockReturnValue(
        of({ condominiumId: 'c1', name: 'Edifício A', city: 'Recife', state: 'PE' }),
      );
    join.mockReset().mockReturnValue(of(undefined));
    joinByCnpj.mockReset().mockReturnValue(of(undefined));
    lookup.mockReset();
  });

  it('waits for the full code before looking it up', async () => {
    const { element } = await setup();
    expect(previewJoin).not.toHaveBeenCalled();
    expect(element.querySelector('input')).not.toBeNull();
  });

  it('shows the preview for a code from the link and sends the request', async () => {
    const { fixture, element } = await setup('abc234defg');
    expect(previewJoin).toHaveBeenCalledWith('ABC234DEFG');
    expect(element.textContent).toContain('Edifício A');
    const joined = vi.fn();
    fixture.componentInstance.joined.subscribe(joined);
    fill(element, 1, '12');
    element.querySelector('form')?.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    expect(join).toHaveBeenCalledWith('ABC234DEFG', { unit: '12', block: undefined });
    expect(joined).toHaveBeenCalled();
  });

  it('does not send without the unit', async () => {
    const { fixture, element } = await setup('abc234defg');
    element.querySelector('form')?.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    expect(join).not.toHaveBeenCalled();
  });

  it('looks the condominium up by CNPJ and joins with unit and block', async () => {
    lookup.mockReturnValue(of({ name: 'Edifício B', city: null, state: null }));
    const { fixture, element } = await setup(undefined, { mode: 'cnpj', cnpj: '11222333000181' });
    expect(lookup).toHaveBeenCalledWith('11222333000181');
    expect(element.textContent).toContain('Edifício B');
    fill(element, 1, '12');
    fill(element, 2, 'A');
    element.querySelector('form')?.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    expect(joinByCnpj).toHaveBeenCalledWith('11222333000181', { unit: '12', block: 'A' });
  });

  it('warns when no active condominium has the CNPJ', async () => {
    lookup.mockReturnValue(of(null));
    const { element } = await setup(undefined, { mode: 'cnpj', cnpj: '11222333000181' });
    expect(element.querySelector('app-alert')).not.toBeNull();
  });

  it('shows an error when the code is unknown', async () => {
    previewJoin.mockReturnValue(throwError(() => ({ status: 404 })));
    const { element } = await setup('ZZZZZZZZZZ');
    expect(element.querySelector('app-alert')).not.toBeNull();
  });
});
