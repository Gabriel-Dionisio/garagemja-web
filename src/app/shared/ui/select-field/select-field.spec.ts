import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { provideTestTranslations } from '../../../testing/translations';
import { SelectField } from './select-field';

describe('SelectField', () => {
  it('traduz o rótulo da opção, exceto quando literal', () => {
    TestBed.configureTestingModule({ providers: [provideTestTranslations()] });
    const fixture = TestBed.createComponent(SelectField);
    fixture.componentRef.setInput('label', 'Campo');
    fixture.componentRef.setInput('control', new FormControl('', { nonNullable: true }));
    fixture.componentRef.setInput('options', [
      { value: 'a', label: 'home.title' },
      { value: 'b', label: '8h', literal: true },
    ]);
    fixture.detectChanges();
    const texts = [...fixture.nativeElement.querySelectorAll('option')].map((o: Element) =>
      o.textContent?.trim(),
    );
    expect(texts).toEqual(['Início', '8h']);
  });
});
