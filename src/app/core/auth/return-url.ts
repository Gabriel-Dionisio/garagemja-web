const DEFAULT_URL = '/home';

export function safeReturnUrl(target: string | null): string {
  return target && target.startsWith('/') && !target.startsWith('//') && !target.includes('\\')
    ? target
    : DEFAULT_URL;
}
