import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PaymentsApi } from '../../data/payments-api';
import { Payment } from '../../payment.model';
import { Rental } from '../../../../shared/rentals/rental.model';
import { PaymentDialog } from './payment-dialog';

const rental = (overrides: Partial<Rental> = {}): Rental => ({
  id: 'r1',
  condominiumName: 'Edifício A',
  parkingSpotNumber: '12',
  startDate: '2026-11-20',
  endDate: '2026-11-21',
  startHour: null,
  endHour: null,
  price: 80,
  total: 240,
  payable: 264,
  status: 'APPROVED',
  cancelReason: null,
  paid: false,
  paymentPending: false,
  ...overrides,
});

const payment = (overrides: Partial<Payment> = {}): Payment => ({
  id: 'p1',
  status: 'PENDING',
  method: 'PIX',
  amount: 264,
  pixCode: 'PIX-CODE-123',
  failureReason: null,
  ...overrides,
});

describe('PaymentDialog', () => {
  const create = vi.fn();
  const get = vi.fn();
  const pendingOf = vi.fn();
  const cancel = vi.fn();
  const close = vi.fn();

  async function setup(data = rental(), settle = true, pending: Payment | null = null) {
    create.mockReset();
    get.mockReset();
    cancel.mockReset();
    close.mockReset();
    pendingOf.mockReset().mockReturnValue(of(pending));
    TestBed.configureTestingModule({
      providers: [
        { provide: DIALOG_DATA, useValue: { rental: data } },
        { provide: DialogRef, useValue: { close } },
        { provide: PaymentsApi, useValue: { create, get, pendingOf, cancel } },
      ],
    });
    const fixture = TestBed.createComponent(PaymentDialog);
    if (settle) await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  const submit = async (fixture: { whenStable(): Promise<unknown> }, element: HTMLElement) => {
    const buttons = element.querySelectorAll<HTMLButtonElement>('app-form-actions button');
    buttons[buttons.length - 1].click();
    await fixture.whenStable();
  };

  it('shows the amount to pay', async () => {
    const { element } = await setup();
    expect(element.textContent).toContain('264,00');
  });

  it('creates a PIX payment and shows the copy-and-paste code', async () => {
    const { fixture, element } = await setup();
    create.mockReturnValue(of(payment()));
    get.mockReturnValue(of(payment()));
    await submit(fixture, element);
    expect(create).toHaveBeenCalledWith({ rentalId: 'r1', method: 'PIX', cardLast4: null });
    expect(element.querySelector<HTMLTextAreaElement>('#pix-code')?.value).toBe('PIX-CODE-123');
  });

  it('closes with success when the card payment is paid', async () => {
    const { fixture, element } = await setup();
    create.mockReturnValue(of(payment({ method: 'CARD', status: 'PAID', pixCode: null })));
    element.querySelectorAll<HTMLElement>('app-chip-group button')[1].click();
    await fixture.whenStable();
    const input = element.querySelector<HTMLInputElement>('app-text-field input')!;
    input.value = '4242';
    input.dispatchEvent(new Event('input'));
    await submit(fixture, element);
    expect(create).toHaveBeenCalledWith({ rentalId: 'r1', method: 'CARD', cardLast4: '4242' });
    expect(close).toHaveBeenCalledWith(true);
  });

  it('does not submit a card without the last 4 digits', async () => {
    const { fixture, element } = await setup();
    element.querySelectorAll<HTMLElement>('app-chip-group button')[1].click();
    await fixture.whenStable();
    await submit(fixture, element);
    expect(create).not.toHaveBeenCalled();
  });

  it('shows the decline and lets the user retry', async () => {
    const { fixture, element } = await setup();
    create.mockReturnValue(of(payment({ method: 'CARD', status: 'FAILED', pixCode: null })));
    element.querySelectorAll<HTMLElement>('app-chip-group button')[1].click();
    await fixture.whenStable();
    const input = element.querySelector<HTMLInputElement>('app-text-field input')!;
    input.value = '0000';
    input.dispatchEvent(new Event('input'));
    await submit(fixture, element);
    expect(element.querySelector('app-alert')).not.toBeNull();
    expect(close).not.toHaveBeenCalled();
  });

  it('resumes a pending PIX and closes once it is paid', async () => {
    vi.useFakeTimers();
    try {
      const { fixture } = await setup(rental({ paymentPending: true }), false, payment());
      get.mockReturnValue(of(payment({ status: 'PAID' })));
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(3000);
      expect(close).toHaveBeenCalledWith(true);
    } finally {
      vi.useRealTimers();
    }
  });
});
