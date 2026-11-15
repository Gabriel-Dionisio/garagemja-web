import { SseParser } from './sse-parser';

describe('SseParser', () => {
  it('emits a message only when the frame is complete', () => {
    const parser = new SseParser();
    expect(parser.feed('event: notification\ndata: {"a"')).toEqual([]);
    expect(parser.feed(':1}\n\n')).toEqual([{ event: 'notification', data: '{"a":1}' }]);
  });

  it('ignores comments and joins multi-line data', () => {
    const parser = new SseParser();
    expect(parser.feed(': hb\n\n')).toEqual([]);
    expect(parser.feed('data: a\r\ndata: b\r\n\r\n')).toEqual([{ event: 'message', data: 'a\nb' }]);
  });

  it('does not split a frame when CRLF is cut between chunks', () => {
    const parser = new SseParser();
    expect(parser.feed('data: a\r')).toEqual([]);
    expect(parser.feed('\n\r\n')).toEqual([{ event: 'message', data: 'a' }]);
  });

  it('rejects a frame that never ends', () => {
    expect(() => new SseParser().feed('x'.repeat(70_000))).toThrow();
  });
});
