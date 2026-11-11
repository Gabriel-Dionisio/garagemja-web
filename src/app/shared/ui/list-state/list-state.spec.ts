import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ListState } from './list-state';

@Component({
  imports: [ListState],
  template: `<app-list-state
    [loading]="loading()"
    [error]="error()"
    [empty]="empty()"
    loadingLabel="Carregando"
    emptyTitle="Nada aqui"
    listLabel="Itens"
    ><li>um</li>
    <span paginator>pag</span></app-list-state
  >`,
})
class Host {
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly empty = signal(false);
}

describe('ListState', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const render = async () => {
      await fixture.whenStable();
      return fixture.nativeElement as HTMLElement;
    };
    return { host: fixture.componentInstance, render };
  }

  it('renders the list and the paginator slot', async () => {
    const { render } = await setup();
    const element = await render();
    expect(element.querySelector('ul[aria-label="Itens"] li')?.textContent).toBe('um');
    expect(element.textContent).toContain('pag');
  });

  it('shows the skeleton while loading', async () => {
    const { host, render } = await setup();
    host.loading.set(true);
    const element = await render();
    expect(element.querySelector('app-skeleton')).not.toBeNull();
    expect(element.querySelector('ul')).toBeNull();
  });

  it('shows the error instead of the list', async () => {
    const { host, render } = await setup();
    host.error.set('Falhou');
    const element = await render();
    expect(element.querySelector('app-alert')?.textContent).toContain('Falhou');
    expect(element.querySelector('ul')).toBeNull();
  });

  it('shows the empty state', async () => {
    const { host, render } = await setup();
    host.empty.set(true);
    const element = await render();
    expect(element.textContent).toContain('Nada aqui');
    expect(element.querySelector('ul')).toBeNull();
  });
});
