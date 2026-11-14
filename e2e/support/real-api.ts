import { expect, type APIRequestContext } from '@playwright/test';

const MAILPIT = 'http://localhost:8025/api/v1';
export const PASSWORD = '@Teste123';

export function uniqueEmail(prefix: string): string {
  return `${prefix}.${Date.now()}${Math.floor(Math.random() * 1000)}@email.com.br`;
}

export function cpfFromBase(base: number[]): string {
  const digit = (digits: number[]) => {
    const sum = digits.reduce((acc, d, i) => acc + d * (digits.length + 1 - i), 0);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  const digits = [...base];
  digits.push(digit(digits));
  digits.push(digit(digits));
  return digits.join('');
}

export function randomCpf(): string {
  const base = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  return cpfFromBase(base.every((d) => d === base[0]) ? [1, ...base.slice(1)] : base);
}

const CNPJ_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function randomCnpj(): string {
  const base = Array.from(
    { length: 12 },
    () => CNPJ_ALPHABET[Math.floor(Math.random() * CNPJ_ALPHABET.length)],
  );
  if (base.every((c) => c === base[0])) base[0] = base[0] === '1' ? '2' : '1';
  const digit = (chars: string[]) => {
    const sum = chars
      .map((c) => c.charCodeAt(0) - 48)
      .reduceRight((acc, value, i) => acc + value * (((chars.length - 1 - i) % 8) + 2), 0);
    const rest = sum % 11;
    return String(rest < 2 ? 0 : 11 - rest);
  };
  base.push(digit(base));
  base.push(digit(base));
  return base.join('');
}

export async function oobCodeFor(
  request: APIRequestContext,
  email: string,
  timeout = 30_000,
): Promise<string> {
  let code: string | undefined;
  await expect
    .poll(
      async () => {
        const search = await request.get(`${MAILPIT}/search`, { params: { query: `to:${email}` } });
        const [message] = (await search.json()).messages ?? [];
        if (!message) return undefined;
        const detail = await (await request.get(`${MAILPIT}/message/${message.ID}`)).json();
        code = /oobCode=([^&"'\s]+)/.exec(detail.HTML ?? detail.Text)?.[1];
        return code;
      },
      { timeout, message: `verification e-mail for ${email}` },
    )
    .toBeTruthy();
  return decodeURIComponent(code!);
}
