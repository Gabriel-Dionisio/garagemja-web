import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Alert } from './alert';

@Component({
  imports: [Alert],
  template: `<app-alert kind="error">Falhou</app-alert><app-alert kind="success">Ok</app-alert>`,
})
class Host {}

describe('Alert', () => {
  it('anuncia erros como alert e demais como status', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const [error, success] = Array.from(
      fixture.nativeElement.querySelectorAll('app-alert'),
    ) as HTMLElement[];
    expect(error.getAttribute('role')).toBe('alert');
    expect(success.getAttribute('role')).toBe('status');
    expect(error.textContent).toContain('Falhou');
  });
});
