export interface SseMessage {
  event: string;
  data: string;
}

const MAX_BUFFER = 64 * 1024;

export class SseParser {
  private buffer = '';

  feed(chunk: string): SseMessage[] {
    this.buffer += chunk;
    const held = this.buffer.endsWith('\r') ? '\r' : '';
    const text = this.buffer.slice(0, this.buffer.length - held.length).replace(/\r\n?/g, '\n');
    const frames = text.split('\n\n');
    this.buffer = (frames.pop() ?? '') + held;
    if (this.buffer.length > MAX_BUFFER) throw new Error('SSE frame too large');
    return frames.flatMap((frame) => {
      let event = 'message';
      const data: string[] = [];
      for (const line of frame.split('\n')) {
        if (line.startsWith(':')) continue;
        const [field, ...rest] = line.split(':');
        const value = rest.join(':').replace(/^ /, '');
        if (field === 'event') event = value;
        else if (field === 'data') data.push(value);
      }
      return data.length ? [{ event, data: data.join('\n') }] : [];
    });
  }
}
