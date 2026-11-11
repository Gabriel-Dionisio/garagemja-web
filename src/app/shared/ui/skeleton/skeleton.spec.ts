import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Skeleton } from './skeleton';
import { SkeletonBlock } from './skeleton-block';

@Component({
  imports: [Skeleton, SkeletonBlock],
  template: `<app-skeleton label="Loading list"
    ><app-skeleton-block width="4rem" height="2rem"
  /></app-skeleton>`,
})
class Host {}

@Component({
  imports: [Skeleton],
  template: `<app-skeleton label="Loading" [rows]="3" rowHeight="2rem" />`,
})
class Rows {}

describe('Skeleton', () => {
  it('exposes a busy status region and hides the shapes from assistive tech', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const region: HTMLElement = fixture.nativeElement.querySelector('app-skeleton');
    expect(region.getAttribute('role')).toBe('status');
    expect(region.getAttribute('aria-busy')).toBe('true');
    expect(region.querySelector('.sr-only')?.textContent).toBe('Loading list');
    expect(region.querySelector('.shapes')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('applies the requested size', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const block: HTMLElement = fixture.nativeElement.querySelector('app-skeleton-block');
    expect(block.style.width).toBe('4rem');
    expect(block.style.height).toBe('2rem');
  });

  it('renders the requested number of placeholder rows', async () => {
    const fixture = TestBed.createComponent(Rows);
    await fixture.whenStable();
    const blocks = fixture.nativeElement.querySelectorAll('app-skeleton-block');
    expect(blocks).toHaveLength(3);
    expect((blocks[0] as HTMLElement).style.height).toBe('2rem');
  });
});
