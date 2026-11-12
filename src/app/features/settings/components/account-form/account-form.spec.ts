import { TestBed } from '@angular/core/testing';
import { provideTransloco } from '@jsverse/transloco';
import { AccountForm } from './account-form';

describe('AccountForm', () => {
  const profile = { id: '1', name: 'Ana Souza', email: 'a@x.com', phone: '', cpf: null };

  async function setup(showPhone: boolean) {
    TestBed.configureTestingModule({
      providers: [
        provideTransloco({ config: { availableLangs: ['pt-BR'], defaultLang: 'pt-BR' } }),
      ],
    });
    const fixture = TestBed.createComponent(AccountForm);
    fixture.componentRef.setInput('profile', profile);
    fixture.componentRef.setInput('showPhone', showPhone);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('mostra nome e telefone quando permitido', async () => {
    expect((await setup(true)).querySelectorAll('app-text-field')).toHaveLength(2);
  });

  it('esconde o telefone para admin', async () => {
    expect((await setup(false)).querySelectorAll('app-text-field')).toHaveLength(1);
  });
});
