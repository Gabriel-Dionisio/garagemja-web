export function focusFirstInvalid(host: HTMLElement): void {
  host.querySelector<HTMLElement>('input.ng-invalid, select.ng-invalid')?.focus();
}
