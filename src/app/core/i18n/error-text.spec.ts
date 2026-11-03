import { TestBed } from '@angular/core/testing';
import { ErrorText } from './error-text';

describe('ErrorText', () => {
  const apiError = {
    status: 500,
    message: null,
    code: null,
    fieldErrors: [],
    retryAfterSeconds: null,
  };

  it('usa a mensagem da API quando existe', () => {
    const state = TestBed.inject(ErrorText).state();
    state.set({ ...apiError, message: 'Falha do servidor' });
    expect(state.text()).toBe('Falha do servidor');
  });

  it('usa o texto padrão e limpa', () => {
    const state = TestBed.inject(ErrorText).state();
    state.set(apiError);
    expect(state.text()).toBeTruthy();
    state.clear();
    expect(state.text()).toBeNull();
  });
});
