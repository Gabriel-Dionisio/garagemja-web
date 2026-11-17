import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { VehiclesApi } from '../../../../shared/vehicles/vehicles-api';
import { VehicleImages } from './vehicle-images';

const image = (id: string) => ({ id, url: `/${id}.png` });
const png = (name = 'a.png') => new File(['x'], name, { type: 'image/png' });

describe('VehicleImages', () => {
  const addImage = vi.fn();
  const removeImage = vi.fn();
  const reorderImages = vi.fn();

  async function setup(images = [image('a')]) {
    addImage.mockReset().mockReturnValue(of([...images, image('new')]));
    removeImage.mockReset().mockReturnValue(of([]));
    reorderImages.mockReset().mockReturnValue(of([...images].reverse()));
    TestBed.configureTestingModule({
      providers: [{ provide: VehiclesApi, useValue: { addImage, removeImage, reorderImages } }],
    });
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
    const fixture = TestBed.createComponent(VehicleImages);
    fixture.componentRef.setInput('images', images);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const choose = async (...files: File[]) => {
      const input = element.querySelector('input[type="file"]') as HTMLInputElement;
      Object.defineProperty(input, 'files', { value: files, configurable: true });
      input.dispatchEvent(new Event('change'));
      await fixture.whenStable();
    };
    return { fixture, element, choose, component: fixture.componentInstance };
  }

  it('stages added and removed photos without calling the API', async () => {
    const { component, element, choose, fixture } = await setup();
    await choose(png());
    expect(component.shown()).toHaveLength(2);
    expect(component.dirty()).toBe(true);
    (element.querySelector('[aria-label="Remover imagem"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(component.shown().map(({ id }) => id)).not.toContain('a');
    expect(addImage).not.toHaveBeenCalled();
    expect(removeImage).not.toHaveBeenCalled();
  });

  it('applies removals and uploads on commit', async () => {
    const { component, element, choose, fixture } = await setup();
    await choose(png());
    (element.querySelector('[aria-label="Remover imagem"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    component.commit('v1', false).subscribe();
    expect(removeImage).toHaveBeenCalledWith('v1', 'a');
    expect(addImage).toHaveBeenCalledWith('v1', expect.any(File));
    expect(component.dirty()).toBe(false);
  });

  it('accepts at most five photos', async () => {
    const { component, choose } = await setup([]);
    await choose(...['1', '2', '3', '4', '5', '6'].map((name) => png(`${name}.png`)));
    expect(component.shown()).toHaveLength(5);
  });

  it('uploads the chosen cover first when creating and ignores a failed upload', async () => {
    const { component, element, choose, fixture } = await setup([]);
    const first = png('first.png');
    const cover = png('cover.png');
    await choose(first, cover);
    (element.querySelector('.next') as HTMLButtonElement).click();
    await fixture.whenStable();
    (element.querySelector('[aria-label="Definir como capa"]') as HTMLButtonElement).click();
    addImage.mockReturnValueOnce(of([image('c')])).mockReturnValueOnce(throwError(() => 'x'));
    let done = false;
    component.commit('v1', true).subscribe({ complete: () => (done = true) });
    expect(addImage.mock.calls.map(([, file]) => file)).toEqual([cover, first]);
    expect(done).toBe(true);
  });

  it('reorders stored photos when another one becomes the cover', async () => {
    const { component, element, fixture } = await setup([image('a'), image('b')]);
    (element.querySelector('.next') as HTMLButtonElement).click();
    await fixture.whenStable();
    (element.querySelector('[aria-label="Definir como capa"]') as HTMLButtonElement).click();
    expect(component.dirty()).toBe(true);
    component.commit('v1', false).subscribe();
    expect(reorderImages).toHaveBeenCalledWith('v1', ['b', 'a']);
    expect(addImage).not.toHaveBeenCalled();
  });

  it('places a new photo as cover by reordering after the upload', async () => {
    const { component, element, choose, fixture } = await setup([image('a')]);
    addImage.mockReturnValue(of([image('a'), image('n')]));
    await choose(png());
    (element.querySelector('.next') as HTMLButtonElement).click();
    await fixture.whenStable();
    (element.querySelector('[aria-label="Definir como capa"]') as HTMLButtonElement).click();
    component.commit('v1', false).subscribe();
    expect(reorderImages).toHaveBeenCalledWith('v1', ['n', 'a']);
  });
});
