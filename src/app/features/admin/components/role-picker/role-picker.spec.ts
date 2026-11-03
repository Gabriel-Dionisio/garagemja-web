import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { provideTransloco } from '@jsverse/transloco';
import { RolePicker } from './role-picker';

describe('RolePicker', () => {
  function setup(missing = false) {
    TestBed.configureTestingModule({
      providers: [
        provideTransloco({ config: { availableLangs: ['pt-BR'], defaultLang: 'pt-BR' } }),
      ],
    });
    const fixture = TestBed.createComponent(RolePicker);
    const group = new FormGroup({
      ADMIN: new FormControl(false, { nonNullable: true }),
      CONDOMINIUM_ADMIN: new FormControl(false, { nonNullable: true }),
      RESIDENT: new FormControl(true, { nonNullable: true }),
    });
    fixture.componentRef.setInput('group', group);
    fixture.componentRef.setInput('missing', missing);
    return { fixture, group, element: fixture.nativeElement as HTMLElement };
  }

  it('permite marcar varios perfis', async () => {
    const { fixture, group, element } = setup();
    await fixture.whenStable();
    const chips = element.querySelectorAll('app-chip-toggle button');
    (chips[0] as HTMLButtonElement).click();
    expect(group.getRawValue()).toEqual({ ADMIN: true, CONDOMINIUM_ADMIN: false, RESIDENT: true });
  });

  it('mostra o erro quando nenhum perfil esta marcado', async () => {
    const { fixture, element } = setup(true);
    await fixture.whenStable();
    expect(element.querySelector('[role="alert"]')).not.toBeNull();
  });
});
