import { TranslocoPipe } from '@jsverse/transloco';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { EMPTY, Observable, catchError, concat, concatMap, defer, from, tap, toArray } from 'rxjs';
import { uniqueId } from '../../../../shared/forms/unique-id';
import { ImageField, ImageItem } from '../../../../shared/ui/image-field/image-field';
import { VehiclesApi } from '../../../../shared/vehicles/vehicles-api';

interface StagedImage {
  id: string;
  url: string;
  file: File;
}

export const MAX_VEHICLE_IMAGES = 5;

@Component({
  selector: 'app-vehicle-images',
  imports: [TranslocoPipe, ImageField],
  templateUrl: './vehicle-images.html',
  styleUrl: './vehicle-images.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VehicleImages {
  private readonly api = inject(VehiclesApi);

  readonly images = model<readonly ImageItem[]>([]);
  readonly busy = input(false);
  readonly disabled = input(false);

  protected readonly maxImages = MAX_VEHICLE_IMAGES;
  private readonly staged = signal<StagedImage[]>([]);
  private readonly removedIds = signal<readonly string[]>([]);
  private readonly order = signal<readonly string[]>([]);

  readonly shown = computed<ImageItem[]>(() => {
    const images = [
      ...this.images().filter((image) => !this.removedIds().includes(image.id)),
      ...this.staged().map(({ id, url }) => ({ id, url })),
    ];
    const rank = (id: string) => {
      const index = this.order().indexOf(id);
      return index < 0 ? Number.MAX_SAFE_INTEGER : index;
    };
    return this.order().length ? [...images].sort((a, b) => rank(a.id) - rank(b.id)) : images;
  });
  readonly dirty = computed(
    () => this.staged().length > 0 || this.removedIds().length > 0 || this.reordered(),
  );
  private readonly reordered = computed(() => {
    const ids = this.shown().map((image) => image.id);
    const current = this.images()
      .map((image) => image.id)
      .filter((id) => ids.includes(id));
    return current.some((id, index) => ids[index] !== id);
  });

  commit(vehicleId: string, created: boolean): Observable<unknown> {
    const desired = this.shown().map((image) => image.id);
    const uploaded = new Map<string, string>();
    const removals = from(this.removedIds()).pipe(
      concatMap((imageId) =>
        this.api.removeImage(vehicleId, imageId).pipe(
          tap((images) => {
            this.images.set(images);
            this.removedIds.update((ids) => ids.filter((removed) => removed !== imageId));
          }),
        ),
      ),
    );
    const pending = desired
      .map((id) => this.staged().find((image) => image.id === id))
      .filter((image) => image !== undefined);
    const additions = from(pending).pipe(
      concatMap((image) => {
        const before = new Set(this.images().map((item) => item.id));
        const upload = this.api.addImage(vehicleId, image.file).pipe(
          tap((images) => {
            uploaded.set(image.id, images.find((item) => !before.has(item.id))?.id ?? image.id);
            this.images.set(images);
            URL.revokeObjectURL(image.url);
            this.staged.update((list) => list.filter((item) => item.id !== image.id));
          }),
        );
        return created ? upload.pipe(catchError(() => EMPTY)) : upload;
      }),
    );
    const reorder = defer(() =>
      this.reorderIfNeeded(
        vehicleId,
        desired.map((id) => uploaded.get(id) ?? id),
      ),
    );
    return concat(removals, additions, reorder).pipe(toArray());
  }

  protected add(file: File): void {
    this.staged.update((list) => [
      ...list,
      { id: uniqueId('staged'), url: URL.createObjectURL(file), file },
    ]);
  }

  protected remove(imageId: string): void {
    const staged = this.staged().find((image) => image.id === imageId);
    if (!staged) {
      this.removedIds.update((ids) => [...ids, imageId]);
      return;
    }
    URL.revokeObjectURL(staged.url);
    this.staged.update((list) => list.filter((image) => image.id !== imageId));
  }

  protected makeCover(id: string): void {
    const ids = this.shown().map((image) => image.id);
    if (!ids.includes(id)) return;
    this.order.set([id, ...ids.filter((other) => other !== id)]);
  }

  private reorderIfNeeded(vehicleId: string, ids: readonly string[]): Observable<unknown> {
    const current = this.images().map((image) => image.id);
    const same = ids.length === current.length && ids.every((id, index) => id === current[index]);
    if (same || ids.some((id) => !current.includes(id))) return EMPTY;
    return this.api.reorderImages(vehicleId, ids).pipe(
      tap((images) => {
        this.images.set(images);
        this.order.set([]);
      }),
    );
  }
}
