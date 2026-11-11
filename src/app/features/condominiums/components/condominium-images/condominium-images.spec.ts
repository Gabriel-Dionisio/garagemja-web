import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CondominiumsApi } from '../../data/condominiums-api';
import { CondominiumImages } from './condominium-images';

const image = (id: string) => ({ id, url: `/${id}.png` });
const file = () => new File(['x'], 'a.png', { type: 'image/png' });

describe('CondominiumImages', () => {
  const addImage = vi.fn();
  const removeImage = vi.fn();

  function setup(editing: boolean, images = [image('a')]) {
    addImage.mockReset().mockReturnValue(of([...images, image('new')]));
    removeImage.mockReset().mockReturnValue(of([]));
    TestBed.configureTestingModule({
      providers: [
        {
          provide: CondominiumsApi,
          useValue: { addImage, removeImage, reorderImages: () => of([]) },
        },
      ],
    });
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
    const fixture = TestBed.createComponent(CondominiumImages);
    fixture.componentRef.setInput('editing', editing);
    fixture.componentRef.setInput('images', images);
    const component = fixture.componentInstance as unknown as {
      add(file: File): void;
      remove(id: string): void;
    };
    return { fixture, component };
  }

  it('uploads staged files after creating', async () => {
    const { fixture, component } = setup(false, []);
    component.add(file());
    await fixture.whenStable();
    expect(fixture.componentInstance.shown()).toHaveLength(1);
    fixture.componentInstance.commit('c1').subscribe();
    expect(addImage).toHaveBeenCalledWith('c1', expect.any(File));
  });

  it('applies removals and additions when editing', async () => {
    const { fixture, component } = setup(true);
    component.remove('a');
    component.add(file());
    await fixture.whenStable();
    expect(fixture.componentInstance.shown().map((item) => item.id)).toHaveLength(1);
    fixture.componentInstance.commit('c1').subscribe();
    expect(removeImage).toHaveBeenCalledWith('c1', 'a');
    expect(addImage).toHaveBeenCalledWith('c1', expect.any(File));
  });
});
