export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function formatCpf(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

export function formatPhone(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits;
  const areaCode = `(${digits.slice(0, 2)}) `;
  const local = digits.slice(2);
  return local.length <= 4
    ? `${areaCode}${local}`
    : `${areaCode}${local.slice(0, local.length - 4)}-${local.slice(-4)}`;
}

const NAME_PARTICLES = new Set(['da', 'das', 'de', 'di', 'do', 'dos', 'du', 'e']);

export function formatNameInput(value: string, final = false): string {
  const words = value
    .normalize('NFC')
    .replace(/[\u2018\u2019`\u00b4]/g, "'")
    .replace(/[^\p{L}' ]/gu, '')
    .replace(/^ +/, '')
    .replace(/ {2,}/g, ' ')
    .replace(/(^| )'+/g, '$1')
    .replace(/'{2,}/g, "'")
    .split(' ');
  return words
    .map((word, index) => {
      const lower = word.toLowerCase();
      const settled = final || index < words.length - 1;
      if (index > 0 && settled && NAME_PARTICLES.has(lower)) return lower;
      return lower.replace(
        /(^|')(\p{L})/gu,
        (_, prefix: string, letter: string) => prefix + letter.toUpperCase(),
      );
    })
    .join(' ');
}

export function formatPasswordInput(value: string): string {
  return value.replace(/[\s\p{Cc}]/gu, '');
}

export function formatEmailInput(value: string): string {
  return value.replace(/\s/g, '').toLowerCase();
}
