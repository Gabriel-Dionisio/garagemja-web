import { TestBed } from '@angular/core/testing';
import { ImageField } from './image-field';

describe('ImageField', () => {
  async function setup() {
    const fixture = TestBed.createComponent(ImageField);
    const selected = vi.fn();
    fixture.componentInstance.selected.subscribe(selected);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const choose = async (file: File) => {
      const input = element.querySelector('input[type="file"]') as HTMLInputElement;
      Object.defineProperty(input, 'files', { value: [file], configurable: true });
      input.dispatchEvent(new Event('change'));
      await fixture.whenStable();
    };
    return { element, selected, choose };
  }

  it('emits a valid image', async () => {
    const { selected, choose } = await setup();
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    await choose(file);
    expect(selected).toHaveBeenCalledWith(file);
  });

  it('rejects non-images and oversized files without emitting', async () => {
    const { element, selected, choose } = await setup();
    await choose(new File(['x'], 'a.txt', { type: 'text/plain' }));
    expect(element.querySelector('[role="alert"]')).not.toBeNull();
    const big = new File(['x'], 'a.png', { type: 'image/png' });
    Object.defineProperty(big, 'size', { value: 6 * 1024 * 1024 });
    await choose(big);
    expect(selected).not.toHaveBeenCalled();
  });

  it('marks the cover and emits moves for the shown image', async () => {
    const fixture = TestBed.createComponent(ImageField);
    fixture.componentRef.setInput('images', [
      { id: 'a', url: 'a.webp' },
      { id: 'b', url: 'b.webp' },
    ]);
    const moved = vi.fn();
    fixture.componentInstance.moved.subscribe(moved);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.badge-cover')).not.toBeNull();
    expect((element.querySelector('.move-back') as HTMLButtonElement).disabled).toBe(true);
    (element.querySelector('.move-forward') as HTMLButtonElement).click();
    expect(moved).toHaveBeenCalledWith({ id: 'a', step: 1 });
  });
});
