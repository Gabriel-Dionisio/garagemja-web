import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ViewEncapsulation,
  afterNextRender,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import * as L from 'leaflet';
import { iconPath } from '../icon/icon';

export interface MapPin {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  count: number;
}

const DEFAULT_CENTER: L.LatLngExpression = [-14.235, -51.925];
const DEFAULT_ZOOM = 4;
const MAX_ZOOM = 15;

@Component({
  selector: 'app-map',
  templateUrl: './map.html',
  styleUrl: './map.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppMap {
  readonly pins = input<readonly MapPin[]>([]);
  readonly selectedId = input<string | null>(null);
  readonly label = input.required<string>();
  readonly zoomInLabel = input.required<string>();
  readonly zoomOutLabel = input.required<string>();
  readonly pinClick = output<string>();

  private readonly container = viewChild.required<ElementRef<HTMLElement>>('container');
  private readonly map = signal<L.Map | null>(null);
  private readonly layer = L.layerGroup();
  private destroyed = false;
  private resizes: ResizeObserver | null = null;

  constructor() {
    afterNextRender(() => {
      if (this.destroyed) return;
      const map = L.map(this.container().nativeElement, {
        worldCopyJump: true,
        attributionControl: false,
        zoomControl: false,
      }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      L.control
        .zoom({ zoomInTitle: this.zoomInLabel(), zoomOutTitle: this.zoomOutLabel() })
        .addTo(map);
      L.control.attribution({ prefix: false }).addTo(map);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        referrerPolicy: 'strict-origin-when-cross-origin',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      this.layer.addTo(map);
      this.map.set(map);
      this.resizes = new ResizeObserver(() => map.invalidateSize());
      this.resizes.observe(this.container().nativeElement);
    });
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      this.resizes?.disconnect();
      this.map()?.remove();
    });

    effect(() => {
      if (!this.map()) return;
      this.draw(this.pins(), this.selectedId());
    });
    effect(() => {
      const map = this.map();
      const pins = this.pins();
      if (!map || !pins.length) return;
      const bounds = L.latLngBounds(pins.map((pin) => L.latLng(pin.latitude, pin.longitude)));
      untracked(() => map.fitBounds(bounds, { padding: [32, 32], maxZoom: MAX_ZOOM }));
    });
  }

  private draw(pins: readonly MapPin[], selectedId: string | null): void {
    this.layer.clearLayers();
    for (const pin of pins) {
      const selected = pin.id === selectedId;
      const marker = L.marker([pin.latitude, pin.longitude], {
        icon: L.divIcon({
          html: pinElement(pin.count, selected),
          className: 'map-pin-wrapper',
          iconSize: [40, 40],
          iconAnchor: [20, 40],
        }),
      });
      marker.addTo(this.layer);
      const element = marker.getElement();
      element?.setAttribute('role', 'button');
      element?.setAttribute('aria-label', pin.label);
      element?.setAttribute('aria-pressed', String(selected));
      element?.addEventListener('keydown', (event) => {
        if (event.key !== ' ') return;
        event.preventDefault();
        this.pinClick.emit(pin.id);
      });
      marker.on('click', () => this.pinClick.emit(pin.id));
    }
  }
}

const SVG = 'http://www.w3.org/2000/svg';

function pinElement(count: number, selected: boolean): HTMLElement {
  const pin = document.createElement('span');
  pin.className = selected ? 'map-pin map-pin--selected' : 'map-pin';
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(SVG, 'path');
  path.setAttribute('d', iconPath('building'));
  svg.append(path);
  const badge = document.createElement('span');
  badge.className = 'map-pin__count';
  badge.textContent = String(count);
  pin.append(svg, badge);
  return pin;
}
