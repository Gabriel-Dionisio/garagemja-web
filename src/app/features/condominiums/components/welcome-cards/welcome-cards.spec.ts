import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTestTranslations } from '../../../../testing/translations';
import { WelcomeCards } from './welcome-cards';

describe('WelcomeCards', () => {
  it('offers the three ways to link an account', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideTestTranslations()] });
    const fixture = TestBed.createComponent(WelcomeCards);
    const code = vi.fn();
    const cnpj = vi.fn();
    fixture.componentInstance.code.subscribe(code);
    fixture.componentInstance.cnpj.subscribe(cnpj);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const buttons = element.querySelectorAll('button');
    buttons[0].click();
    buttons[1].click();
    expect(code).toHaveBeenCalled();
    expect(cnpj).toHaveBeenCalled();
    expect(element.querySelector('a')?.getAttribute('href')).toBe('/condominiums/new');
    expect(element.querySelectorAll('li')).toHaveLength(3);
  });
});
