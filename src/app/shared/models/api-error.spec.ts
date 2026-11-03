import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { toApiError } from './api-error.mapper';

describe('toApiError', () => {
  it('lê mensagem, erros de campo e Retry-After', () => {
    const error = new HttpErrorResponse({
      status: 429,
      headers: new HttpHeaders({ 'Retry-After': '30' }),
      error: { message: 'Aguarde', errors: [{ field: 'email', message: 'inválido' }, { nope: 1 }] },
    });
    expect(toApiError(error)).toEqual({
      status: 429,
      message: 'Aguarde',
      code: null,
      fieldErrors: [{ field: 'email', message: 'inválido' }],
      retryAfterSeconds: 30,
    });
  });

  it('devolve mensagem nula quando o servidor não envia uma', () => {
    expect(toApiError(new HttpErrorResponse({ status: 503 })).message).toBeNull();
    expect(toApiError(new Error('x')).status).toBe(0);
  });
});
