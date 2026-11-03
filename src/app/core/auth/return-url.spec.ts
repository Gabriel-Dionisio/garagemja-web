import { safeReturnUrl } from './return-url';

describe('safeReturnUrl', () => {
  it('aceita caminhos internos', () => {
    expect(safeReturnUrl('/users?page=2')).toBe('/users?page=2');
  });

  it.each([null, '', 'https://evil.test', '//evil.test', '/\\evil.test'])(
    'volta para /home com %s',
    (target) => {
      expect(safeReturnUrl(target)).toBe('/home');
    },
  );
});
