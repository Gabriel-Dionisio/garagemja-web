import { TestBed } from '@angular/core/testing';
import { BrazilLookup } from './brazil-lookup';

describe('BrazilLookup', () => {
  const respond = (body: unknown, ok = true) =>
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok, json: async () => body }));

  afterEach(() => vi.unstubAllGlobals());

  it('maps a CEP answer', async () => {
    respond({
      street: 'Avenida Paulista',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'sp',
    });
    const address = await TestBed.inject(BrazilLookup).cep('01310-100');
    expect(address).toEqual({
      address: 'Avenida Paulista',
      district: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
    });
    expect(fetch).toHaveBeenCalledWith(
      'https://brasilapi.com.br/api/cep/v2/01310100',
      expect.objectContaining({ credentials: 'omit' }),
    );
  });

  it('maps a CNPJ answer and flags inactive companies', async () => {
    respond({
      razao_social: 'ACME LTDA',
      nome_fantasia: '',
      descricao_tipo_de_logradouro: 'RUA',
      logradouro: 'DAS FLORES',
      numero: '10',
      bairro: 'CENTRO',
      municipio: 'SAO PAULO',
      uf: 'SP',
      cep: '01310100',
      descricao_situacao_cadastral: 'BAIXADA',
    });
    const data = await TestBed.inject(BrazilLookup).cnpj('11.222.333/0001-81');
    expect(data).toMatchObject({ name: 'Acme Ltda', address: 'Rua Das Flores', active: false });
  });

  it('returns null on bad input, HTTP error or network failure', async () => {
    const lookup = TestBed.inject(BrazilLookup);
    expect(await lookup.cep('123')).toBeNull();
    respond({}, false);
    expect(await lookup.cep('01310100')).toBeNull();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    expect(await lookup.cnpj('11222333000181')).toBeNull();
  });
});
