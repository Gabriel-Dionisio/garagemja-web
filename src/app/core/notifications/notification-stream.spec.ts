import { TestBed } from '@angular/core/testing';
import { NotificationStream, StreamRejected } from './notification-stream';

const row = {
  id: 'n1',
  kind: 'RENTAL_APPROVED',
  condominiumName: 'Solar',
  reason: null,
  createdAt: '2026-11-15T12:00:00Z',
  read: false,
};

function streamOf(...chunks: string[]): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
      controller.close();
    },
  });
  return new Response(body, { status: 200 });
}

describe('NotificationStream', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('emits valid notifications, skips bad frames and errors when the server closes', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          streamOf(
            ': ok\n\n',
            `event: notification\ndata: ${JSON.stringify(row)}\n\n`,
            'event: notification\ndata: {oops\n\n',
          ),
        ),
    );
    const onOpen = vi.fn();
    const seen: string[] = [];
    const error = await new Promise<unknown>((resolve) =>
      TestBed.inject(NotificationStream)
        .connect(onOpen)
        .subscribe({ next: (value) => seen.push(value.id), error: resolve }),
    );
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(seen).toEqual(['n1']);
    expect((error as Error).message).toBe('Stream closed');
  });

  it('flags 429 as fatal and 401 as transient', async () => {
    const connect = (status: number) => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status })));
      return new Promise<unknown>((resolve) =>
        TestBed.inject(NotificationStream)
          .connect(() => undefined)
          .subscribe({ error: resolve }),
      );
    };
    const rejected = (await connect(429)) as StreamRejected;
    expect(rejected.fatal).toBe(true);
    expect(((await connect(401)) as StreamRejected).fatal).toBe(false);
  });
});
