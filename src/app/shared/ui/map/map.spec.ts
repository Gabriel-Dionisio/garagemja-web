import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AppMap, MapPin } from './map';

const pin = (id: string, count: number): MapPin => ({
  id,
  label: `Solar ${id}`,
  latitude: -23.5,
  longitude: -46.6,
  count,
});

@Component({
  imports: [AppMap],
  template: `<app-map
    label="Mapa"
    zoomInLabel="Mais"
    zoomOutLabel="Menos"
    [pins]="pins()"
    [selectedId]="selected()"
    (pinClick)="clicked.push($event)"
  />`,
})
class Host {
  readonly pins = signal<MapPin[]>([pin('a', 3), pin('b', 0)]);
  readonly selected = signal<string | null>(null);
  readonly clicked: string[] = [];
}

describe('AppMap', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('draws one accessible button per pin with its count', async () => {
    const { element } = await setup();
    const markers = element.querySelectorAll<HTMLElement>('.leaflet-marker-icon');
    expect(markers).toHaveLength(2);
    expect(markers[0].getAttribute('role')).toBe('button');
    expect(markers[0].getAttribute('aria-label')).toBe('Solar a');
    expect(markers[0].textContent).toBe('3');
    expect(element.querySelector('[role="region"]')?.getAttribute('aria-label')).toBe('Mapa');
    expect(element.querySelector('.leaflet-control-zoom-in')?.getAttribute('title')).toBe('Mais');
  });

  it('emits the pin id on click and on the space key', async () => {
    const { fixture, element } = await setup();
    const marker = element.querySelector<HTMLElement>('.leaflet-marker-icon')!;
    marker.click();
    marker.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    expect(fixture.componentInstance.clicked).toEqual(['a', 'a']);
  });

  it('marks the selected pin as pressed', async () => {
    const { fixture, element } = await setup();
    fixture.componentInstance.selected.set('b');
    await fixture.whenStable();
    const [first, second] = Array.from(
      element.querySelectorAll<HTMLElement>('.leaflet-marker-icon'),
    );
    expect(first.getAttribute('aria-pressed')).toBe('false');
    expect(second.getAttribute('aria-pressed')).toBe('true');
  });

  it('removes the map when destroyed', async () => {
    const { fixture, element } = await setup();
    fixture.destroy();
    expect(element.querySelector('.leaflet-pane')).toBeNull();
  });
});
