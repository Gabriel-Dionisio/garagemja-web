import { timeZoneLabel, utcOffsetLabel } from './time-zone';

describe('time zone label', () => {
  const original = process.env['TZ'];

  afterEach(() => {
    process.env['TZ'] = original;
  });

  it('formats the browser offset with a true minus sign', () => {
    process.env['TZ'] = 'America/Sao_Paulo';
    expect(utcOffsetLabel(new Date('2026-11-10T12:00:00Z'))).toBe('UTC−03:00');
  });

  it('names the zone in the active language', () => {
    process.env['TZ'] = 'America/Sao_Paulo';
    expect(timeZoneLabel('pt-BR', new Date('2026-11-10T12:00:00Z'))).toBe(
      'Horário Padrão de Brasília (UTC−03:00)',
    );
  });

  it('writes UTC+00:00 for the zero offset', () => {
    process.env['TZ'] = 'UTC';
    expect(utcOffsetLabel(new Date('2026-11-10T12:00:00Z'))).toBe('UTC+00:00');
  });
});
