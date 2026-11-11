import { TranslocoPipe } from '@jsverse/transloco';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { Button } from '../../../../shared/ui/button/button';

type Copied = 'code' | 'link';

@Component({
  selector: 'app-join-code-card',
  imports: [TranslocoPipe, Button],
  templateUrl: './join-code-card.html',
  styleUrl: './join-code-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JoinCodeCard {
  readonly code = input.required<string>();
  readonly condominiumName = input('');
  readonly busy = input(false);
  readonly rotate = output<void>();

  protected readonly link = computed(() => `${location.origin}/join/${this.code()}`);
  protected readonly canShare = typeof navigator.share === 'function';
  protected readonly copied = signal<Copied | null>(null);
  protected readonly qr = signal<string | null>(null);

  constructor() {
    effect((onCleanup) => {
      const link = this.link();
      let stale = false;
      onCleanup(() => (stale = true));
      this.qr.set(null);
      import('qrcode')
        .then(({ toDataURL }) => toDataURL(link, { margin: 1, width: 192 }))
        .then((url) => !stale && this.qr.set(url))
        .catch(() => undefined);
    });
  }

  protected copy(kind: Copied): void {
    navigator.clipboard
      .writeText(kind === 'code' ? this.code() : this.link())
      .then(() => this.copied.set(kind))
      .catch(() => this.copied.set(null));
  }

  protected share(): void {
    navigator.share({ title: this.condominiumName(), url: this.link() }).catch(() => undefined);
  }
}
