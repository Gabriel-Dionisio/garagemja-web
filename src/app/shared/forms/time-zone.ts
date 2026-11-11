import { Language } from '../../core/i18n/locale-service';

function zoneName(date: Date, language: Language): string {
  const options: Intl.DateTimeFormatOptions[] = [
    { timeZoneName: 'longGeneric' },
    { timeZoneName: 'long' },
  ];
  for (const option of options) {
    const part = new Intl.DateTimeFormat(language, option)
      .formatToParts(date)
      .find((item) => item.type === 'timeZoneName');
    if (part?.value) return part.value;
  }
  return '';
}

export function utcOffsetLabel(date: Date): string {
  const part = new Intl.DateTimeFormat('en', { timeZoneName: 'longOffset' })
    .formatToParts(date)
    .find((item) => item.type === 'timeZoneName');
  const offset = part?.value.replace('GMT', '').replace('-', '−') ?? '';
  return `UTC${offset || '+00:00'}`;
}

export function timeZoneLabel(language: Language, date = new Date()): string {
  const name = zoneName(date, language);
  const offset = utcOffsetLabel(date);
  return name ? `${name} (${offset})` : offset;
}
