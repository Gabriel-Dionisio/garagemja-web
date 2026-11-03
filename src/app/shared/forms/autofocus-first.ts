import { Directive, ElementRef, afterNextRender, inject } from '@angular/core';

@Directive({ selector: '[appAutofocusFirst]' })
export class AutofocusFirst {
  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    afterNextRender(() =>
      host.querySelector<HTMLElement>('input:not([disabled]), select:not([disabled])')?.focus(),
    );
  }
}
