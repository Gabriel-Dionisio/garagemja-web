import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ReviewsApi } from '../reviews-api';
import { ReviewDialog } from './review-dialog';

describe('ReviewDialog', () => {
  const create = vi.fn();
  const close = vi.fn();

  async function setup() {
    create.mockReset().mockReturnValue(of({}));
    close.mockReset();
    TestBed.configureTestingModule({
      providers: [
        { provide: ReviewsApi, useValue: { create } },
        { provide: DialogRef, useValue: { close } },
        { provide: DIALOG_DATA, useValue: { rentalId: 'r1', subjectKey: 'spot' } },
      ],
    });
    const fixture = TestBed.createComponent(ReviewDialog);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const submit = async () => {
      element.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
      await fixture.whenStable();
    };
    const pick = async (rating: number) => {
      element.querySelectorAll<HTMLButtonElement>('app-chip-group button')[rating - 1].click();
      await fixture.whenStable();
    };
    return { fixture, element, submit, pick };
  }

  it('does not submit without a rating', async () => {
    const { submit } = await setup();
    await submit();
    expect(create).not.toHaveBeenCalled();
  });

  it('sends the chosen rating and closes with success', async () => {
    const { pick, submit } = await setup();
    await pick(4);
    await submit();
    expect(create).toHaveBeenCalledWith('r1', 4, '');
    expect(close).toHaveBeenCalledWith(true);
  });

  it('keeps the dialog open and shows the error on conflict', async () => {
    const { element, fixture, pick, submit } = await setup();
    create.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
    await pick(5);
    await submit();
    fixture.detectChanges();
    expect(element.querySelector('app-alert')).not.toBeNull();
    expect(close).not.toHaveBeenCalled();
  });
});
