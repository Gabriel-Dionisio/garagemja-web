import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ConfirmService } from '../../../../shared/ui/confirm-dialog/confirm-service';
import { ParkingSpotsApi } from '../../../../shared/spots/parking-spots-api';
import { ParkingSpotFormPage } from './parking-spot-form-page';

describe('ParkingSpotFormPage', () => {
  const create = vi.fn();
  const addImage = vi.fn();
  const update = vi.fn();
  const reorderImages = vi.fn();
  const stored = [
    { id: 'a', url: '/a.png' },
    { id: 'b', url: '/b.png' },
  ];
  const spot = {
    id: 's1',
    condominiumId: 'c1',
    number: '12',
    location: null,
    size: null,
    covered: false,
    owner: null,
    status: 'PENDING',
    statusReason: null,
  };

  async function setup(spotId?: string) {
    create.mockReset();
    addImage.mockReset().mockReturnValue(of([]));
    update.mockReset().mockReturnValue(of(spot));
    reorderImages.mockReset().mockReturnValue(of([...stored].reverse()));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        {
          provide: ParkingSpotsApi,
          useValue: {
            condominium: () =>
              of({ id: 'c1', name: 'Edifício A', status: 'ACTIVE', canManage: !!spotId }),
            create,
            addImage,
            update,
            reorderImages,
            get: () => of(spot),
            images: () => of(stored),
          },
        },
        { provide: ConfirmService, useValue: { confirm: () => of(true) } },
      ],
    });
    const fixture = TestBed.createComponent(ParkingSpotFormPage);
    fixture.componentRef.setInput('id', 'c1');
    if (spotId) fixture.componentRef.setInput('spotId', spotId);
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

  it('uploads the chosen cover first when creating', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:x');
    const { fixture, element } = await setup();
    create.mockReturnValue(of({ id: 's1', status: 'PENDING' }));
    const page = fixture.componentInstance as unknown as {
      form: { controls: { number: { setValue(v: string): void } } };
      addImage(file: File): void;
      makeCover(id: string): void;
      images(): { id: string }[];
    };
    const first = new File(['a'], 'a.png', { type: 'image/png' });
    const cover = new File(['b'], 'b.png', { type: 'image/png' });
    page.form.controls.number.setValue('12');
    page.addImage(first);
    page.addImage(cover);
    page.makeCover(page.images()[1].id);
    element.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    await fixture.whenStable();
    expect(addImage.mock.calls.map(([, file]) => file)).toEqual([cover, first]);
    expect(reorderImages).not.toHaveBeenCalled();
  });

  it('reorders the stored images when another one becomes the cover', async () => {
    const { fixture, element } = await setup('s1');
    expect(element.querySelector('button[type="submit"]')).toBeNull();
    (fixture.componentInstance as unknown as { makeCover(id: string): void }).makeCover('b');
    await fixture.whenStable();
    element.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    await fixture.whenStable();
    expect(update).toHaveBeenCalled();
    expect(reorderImages).toHaveBeenCalledWith('s1', ['b', 'a']);
  });

  it('keeps the chosen cover when one of the new images fails to upload', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:x');
    const { fixture, element } = await setup('s1');
    addImage
      .mockReturnValueOnce(throwError(() => new Error('upload failed')))
      .mockReturnValueOnce(of([...stored, { id: 'd', url: '/d.png' }]));
    const page = fixture.componentInstance as unknown as {
      addImage(file: File): void;
      makeCover(id: string): void;
    };
    page.addImage(new File(['c'], 'c.png', { type: 'image/png' }));
    page.addImage(new File(['d'], 'd.png', { type: 'image/png' }));
    page.makeCover('b');
    await fixture.whenStable();
    element.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    await fixture.whenStable();
    expect(reorderImages).toHaveBeenCalledWith('s1', ['b', 'a', 'd']);
  });
});
