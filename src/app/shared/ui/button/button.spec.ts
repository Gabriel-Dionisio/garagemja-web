import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Button } from './button';

@Component({
  imports: [Button],
  template: `<button appButton variant="danger" [loading]="loading()" [disabled]="disabled()">
    Salvar
  </button>`,
})
class Host {
  readonly loading = signal(false);
  readonly disabled = signal(false);
}

describe('Button', () => {
  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    return { fixture, button: fixture.nativeElement.querySelector('button') as HTMLButtonElement };
  }

  it('expõe a variante e o conteúdo', () => {
    const { button } = setup();
    expect(button.dataset['variant']).toBe('danger');
    expect(button.textContent).toContain('Salvar');
    expect(button.disabled).toBe(false);
  });

  it('desabilita e sinaliza ocupado durante o carregamento', async () => {
    const { fixture, button } = setup();
    fixture.componentInstance.loading.set(true);
    await fixture.whenStable();
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.querySelector('app-spinner')).not.toBeNull();
  });

  it('respeita disabled', async () => {
    const { fixture, button } = setup();
    fixture.componentInstance.disabled.set(true);
    await fixture.whenStable();
    expect(button.disabled).toBe(true);
  });
});
