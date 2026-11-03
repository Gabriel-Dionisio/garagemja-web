import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Paginator } from './paginator';

@Component({
  imports: [Paginator],
  template: `<app-paginator
    [page]="page"
    [hasNext]="hasNext"
    [size]="20"
    [total]="total"
    [itemCount]="itemCount"
    (pageChange)="changed = $event"
  />`,
})
class Host {
  page = 0;
  hasNext = true;
  total: number | undefined = undefined;
  itemCount = 0;
  changed: number | null = null;
}

describe('Paginator', () => {
  async function setup(page: number, hasNext: boolean) {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.page = page;
    fixture.componentInstance.hasNext = hasNext;
    await fixture.whenStable();
    const buttons = fixture.nativeElement.querySelectorAll(
      'button',
    ) as NodeListOf<HTMLButtonElement>;
    return { fixture, previous: buttons[0], next: buttons[1] };
  }

  it('desabilita Anterior na primeira página e emite a próxima', async () => {
    const { fixture, previous, next } = await setup(0, true);
    expect(previous.disabled).toBe(true);
    next.click();
    expect(fixture.componentInstance.changed).toBe(1);
  });

  it('desabilita Próxima na última página', async () => {
    const { fixture, previous, next } = await setup(2, false);
    expect(next.disabled).toBe(true);
    previous.click();
    expect(fixture.componentInstance.changed).toBe(1);
  });

  it('mostra o intervalo exibido quando o total é conhecido', async () => {
    const fixture = TestBed.createComponent(Host);
    Object.assign(fixture.componentInstance, { page: 1, total: 135, itemCount: 20 });
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.summary')?.textContent).toContain('21–40 de 135');
  });
});
