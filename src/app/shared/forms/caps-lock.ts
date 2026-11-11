import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CapsLock {
  readonly active = signal(false);
  private keyDown = false;

  constructor() {
    const target = inject(DOCUMENT);
    const listen = (type: string, handler: (event: Event) => void) =>
      target.addEventListener(type, handler, { capture: true, passive: true });
    listen('keydown', (event) => this.onKey(event as KeyboardEvent, true));
    listen('keyup', (event) => this.onKey(event as KeyboardEvent, false));
    listen('mousedown', (event) =>
      this.active.set((event as MouseEvent).getModifierState('CapsLock')),
    );
  }

  // The Caps Lock key reports a stale state on its own events and, on macOS, fires only one of
  // keydown/keyup per toggle, so it flips the known state instead of reading it.
  private onKey(event: KeyboardEvent, down: boolean): void {
    if (event.key !== 'CapsLock') {
      this.active.set(event.getModifierState('CapsLock'));
      return;
    }
    if (event.repeat) return;
    if (down) {
      this.keyDown = true;
      this.active.update((on) => !on);
    } else {
      if (!this.keyDown) this.active.update((on) => !on);
      this.keyDown = false;
    }
  }
}
