import { Injectable } from '@angular/core';
import { onlyCnpj, onlyDigits } from '../forms/masks';

const BASE_URL = 'https://brasilapi.com.br/api';
const TIMEOUT_MS = 6000;

export interface CepAddress {
  address: string;
  district: string;
  city: string;
  state: string;
}

export interface CnpjData extends CepAddress {
  name: string;
  number: string;
  zipCode: string;
  active: boolean;
}

const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const titleCase = (value: string): string =>
  value
    .toLowerCase()
    .replace(/(^|[\s(/-])(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toUpperCase());

@Injectable({ providedIn: 'root' })
export class BrazilLookup {
  async cep(cep: string): Promise<CepAddress | null> {
    const digits = onlyDigits(cep);
    if (digits.length !== 8) return null;
    const body = await this.get(`/cep/v2/${digits}`);
    if (!body) return null;
    return {
      address: text(body['street']),
      district: text(body['neighborhood']),
      city: text(body['city']),
      state: text(body['state']).toUpperCase(),
    };
  }

  async cnpj(cnpj: string): Promise<CnpjData | null> {
    const chars = onlyCnpj(cnpj);
    if (chars.length !== 14) return null;
    const body = await this.get(`/cnpj/v1/${chars}`);
    if (!body) return null;
    const street = [text(body['descricao_tipo_de_logradouro']), text(body['logradouro'])]
      .filter(Boolean)
      .join(' ');
    return {
      name: titleCase(text(body['nome_fantasia']) || text(body['razao_social'])),
      address: titleCase(street),
      number: text(body['numero']),
      district: titleCase(text(body['bairro'])),
      city: titleCase(text(body['municipio'])),
      state: text(body['uf']).toUpperCase(),
      zipCode: onlyDigits(text(body['cep'])),
      active: text(body['descricao_situacao_cadastral']).toUpperCase() === 'ATIVA',
    };
  }

  private async get(path: string): Promise<Record<string, unknown> | null> {
    try {
      const response = await fetch(BASE_URL + path, {
        headers: { Accept: 'application/json' },
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!response.ok) return null;
      const body: unknown = await response.json();
      return body !== null && typeof body === 'object' ? (body as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
}
