import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ConfirmService } from '../../../../shared/ui/confirm-dialog/confirm-service';
import { ParkingSpotsApi } from '../../../../shared/spots/parking-spots-api';
import { ParkingSpotFormPage } from './parking-spot-form-page';

describe('ParkingSpotFormPage', () => {
  const create = vi.fn();
  const addImage = vi.fn();

  async function setup() {
    create.mockReset();
    addImage.mockReset().mockReturnValue(of([]));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        {
          provide: ParkingSpotsApi,
          useValue: {
            condominium: () =>
              of({ id: 'c1', name: 'Edifício A', status: 'ACTIVE', canManage: false }),
            create,
            addImage,
          },
        },
        { provide: ConfirmService, useValue: { confirm: () => of(true) } },
      ],
    });
    const fixture = TestBed.createComponent(ParkingSpotFormPage);
    fixture.componentRef.setInput('id', 'c1');
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('shows the required error and sends nothing when submitted empty', async () => {
    const { fixture, element } = await setup();
    element.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    await fixture.whenStable();
    expect(create).not.toHaveBeenCalled();
    expect(element.textContent).toContain('Campo obrigatório.');
  });

  it('uploads every staged image after creating the spot', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:x');
    const { fixture, element } = await setup();
    create.mockReturnValue(of({ id: 's1', status: 'PENDING' }));
    const form = fixture.componentInstance as unknown as {
      form: { controls: { number: { setValue(v: string): void } } };
      addImage(file: File): void;
    };
    form.form.controls.number.setValue('12');
    form.addImage(new File(['a'], 'a.png', { type: 'image/png' }));
    form.addImage(new File(['b'], 'b.png', { type: 'image/png' }));
    element.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    await fixture.whenStable();
    expect(addImage).toHaveBeenCalledTimes(2);
  });
});
