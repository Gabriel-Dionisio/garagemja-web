import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppNotification } from './notification.model';
import { toNotification } from './notifications-api';
import { SseParser } from './sse-parser';

const STREAM_URL = '/api/v1/me/notifications/stream';

export class StreamRejected extends Error {
  constructor(readonly status: number) {
    super(`Stream ${status}`);
  }

  get fatal(): boolean {
    return this.status === 403 || this.status === 404 || this.status === 429;
  }
}

function parseNotification(data: string): AppNotification | null {
  try {
    return toNotification(JSON.parse(data));
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class NotificationStream {
  connect(onOpen: () => void): Observable<AppNotification> {
    return new Observable((subscriber) => {
      const abort = new AbortController();
      const parser = new SseParser();
      const decoder = new TextDecoder();
      const run = async (): Promise<void> => {
        const response = await fetch(STREAM_URL, {
          headers: { Accept: 'text/event-stream' },
          credentials: 'same-origin',
          signal: abort.signal,
        });
        if (!response.ok || !response.body) throw new StreamRejected(response.status);
        onOpen();
        const reader = response.body.getReader();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) throw new Error('Stream closed');
          for (const message of parser.feed(decoder.decode(value, { stream: true }))) {
            const notification =
              message.event === 'notification' ? parseNotification(message.data) : null;
            if (notification) subscriber.next(notification);
          }
        }
      };
      run().catch((error: unknown) => {
        if (!abort.signal.aborted) subscriber.error(error);
      });
      return () => abort.abort();
    });
  }
}
