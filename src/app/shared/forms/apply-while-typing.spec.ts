import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { applyWhileTyping } from './apply-while-typing';

describe('applyWhileTyping', () => {
  function setup() {
    vi.useFakeTimers();
    const apply = vi.fn();
    const form = new FormGroup({
      search: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(5)] }),
    });
    TestBed.runInInjectionContext(() => applyWhileTyping(form, apply));
    return { apply, form };
  }

  afterEach(() => vi.useRealTimers());

  it('aplica uma vez após a pausa, com o último valor', () => {
    const { apply, form } = setup();
    form.controls['search'].setValue('s');
    form.controls['search'].setValue('so');
    vi.advanceTimersByTime(299);
    expect(apply).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(apply).toHaveBeenCalledTimes(1);
  });

  it('ignora mudança só de espaços e valor inalterado', () => {
    const { apply, form } = setup();
    form.controls['search'].setValue('  ');
    vi.advanceTimersByTime(300);
    expect(apply).not.toHaveBeenCalled();
  });

  it('não aplica enquanto o formulário é inválido', () => {
    const { apply, form } = setup();
    form.controls['search'].setValue('muito longo');
    vi.advanceTimersByTime(300);
    expect(apply).not.toHaveBeenCalled();
  });
});
