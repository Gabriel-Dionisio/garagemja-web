import { TestBed } from '@angular/core/testing';
import { Condominium } from '../../condominium.model';
import { STATUS_ACTIONS } from '../../condominium-status-actions';
import { CondominiumStatusPanel } from './condominium-status-panel';

const condominium = {
  id: 'c1',
  name: 'Edifício A',
  status: 'ACTIVE',
  statusReason: null,
  resides: false,
} as Condominium;

function render(inputs: Record<string, unknown>) {
  const fixture = TestBed.createComponent(CondominiumStatusPanel);
  fixture.componentRef.setInput('condominium', condominium);
  for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
  return fixture;
}

describe('CondominiumStatusPanel', () => {
  it('shows the counts', async () => {
    const fixture = render({ counts: { residents: 12, parkingSpots: 7, activeRentals: 3 } });
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('.counts')?.textContent).toContain(
      '12',
    );
  });

  it('emits the chosen status action and disables it while busy', async () => {
    const [action] = STATUS_ACTIONS['ACTIVE'];
    const fixture = render({ statusActions: [action] });
    const emitted: unknown[] = [];
    fixture.componentInstance.changeStatus.subscribe((value) => emitted.push(value));
    await fixture.whenStable();
    const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '.review button',
    )!;
    button.click();
    expect(emitted).toEqual([action]);
    fixture.componentRef.setInput('busy', true);
    await fixture.whenStable();
    expect(button.disabled).toBe(true);
  });

  it('offers residency and leaving management only when membership is open', async () => {
    const fixture = render({ membershipOpen: false });
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.review')).toBeNull();
    fixture.componentRef.setInput('membershipOpen', true);
    await fixture.whenStable();
    expect(element.querySelectorAll('.review button')).toHaveLength(2);
  });
});
