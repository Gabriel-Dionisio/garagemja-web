import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActionItem } from '../action-list/action-item';
import { Fab } from './fab';

@Component({
  imports: [Fab, ActionItem],
  template: `<app-fab label="Criar"><button appActionItem icon="plus">Novo</button></app-fab>`,
})
class Host {}

describe('Fab', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const toggle = () => root.querySelector<HTMLButtonElement>('button[aria-haspopup]')!;
    const settle = async () => {
      await fixture.whenStable();
      return root;
    };
    return { root, toggle, settle };
  }

  it('opens the menu on click and reflects aria-expanded', async () => {
    const { toggle, settle } = await setup();
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    toggle().click();
    const root = await settle();
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
    expect(root.querySelector('app-action-list button')).not.toBeNull();
  });

  it('closes on item click, Escape and outside click', async () => {
    const { toggle, settle } = await setup();
    toggle().click();
    let root = await settle();
    root.querySelector<HTMLButtonElement>('app-action-list button')!.click();
    root = await settle();
    expect(root.querySelector('app-action-list')).toBeNull();

    toggle().click();
    await settle();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    root = await settle();
    expect(root.querySelector('app-action-list')).toBeNull();

    toggle().click();
    await settle();
    document.body.click();
    root = await settle();
    expect(root.querySelector('app-action-list')).toBeNull();
  });
});
