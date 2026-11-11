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
import { ImageField } from '../../../../shared/ui/image-field/image-field';
import { CondominiumImage } from '../../condominium.model';
import { CondominiumsApi } from '../../data/condominiums-api';

interface StagedImage {
  id: string;
  url: string;
  file: File;
}

const MAX_IMAGES = 5;

@Component({
  selector: 'app-condominium-images',
  imports: [TranslocoPipe, ImageField],
  templateUrl: './condominium-images.html',
  styleUrl: './condominium-images.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CondominiumImages {
  private readonly api = inject(CondominiumsApi);

  readonly images = model<CondominiumImage[]>([]);
  readonly editing = input(false);
  readonly busy = input(false);
  readonly disabled = input(false);

  protected readonly maxImages = MAX_IMAGES;
  protected readonly staged = signal<StagedImage[]>([]);
  private readonly removedIds = signal<readonly string[]>([]);
  private readonly order = signal<readonly string[]>([]);

  readonly shown = computed(() => {
    const images = this.editing()
      ? [
          ...this.images().filter((image) => !this.removedIds().includes(image.id)),
          ...this.staged(),
        ]
      : this.staged();
    const rank = (id: string) => {
      const index = this.order().indexOf(id);
      return index < 0 ? Number.MAX_SAFE_INTEGER : index;
    };
    return this.order().length ? [...images].sort((a, b) => rank(a.id) - rank(b.id)) : images;
  });

  commit(condominiumId: string): Observable<unknown> {
    return this.editing() ? this.applyChanges(condominiumId) : this.uploadStaged(condominiumId);
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

  protected move({ id, step }: { id: string; step: -1 | 1 }): void {
    const ids = this.shown().map((image) => image.id);
    const index = ids.indexOf(id);
    const target = index + step;
    if (index < 0 || target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    this.order.set(ids);
  }

  private uploadStaged(condominiumId: string): Observable<unknown> {
    return from(this.staged()).pipe(
      concatMap((image) =>
        this.api.addImage(condominiumId, image.file).pipe(catchError(() => EMPTY)),
      ),
      toArray(),
    );
  }

  private reorderIfNeeded(id: string, ids: readonly string[]): Observable<unknown> {
    this.order.set([]);
    const current = this.images().map((image) => image.id);
    const same = ids.length === current.length && ids.every((value, i) => value === current[i]);
    if (same || ids.some((value) => !current.includes(value))) return EMPTY;
    return this.api.reorderImages(id, ids).pipe(tap((images) => this.images.set(images)));
  }

  private applyChanges(id: string): Observable<unknown> {
    const desired = this.shown().map((image) => image.id);
    const created = new Map<string, string>();
    return concat(
      from(this.removedIds()).pipe(
        concatMap((imageId) =>
          this.api.removeImage(id, imageId).pipe(
            tap((images) => {
              this.images.set(images);
              this.removedIds.update((ids) => ids.filter((removed) => removed !== imageId));
            }),
          ),
        ),
      ),
      from(this.staged()).pipe(
        concatMap((image) => {
          const before = new Set(this.images().map((item) => item.id));
          return this.api.addImage(id, image.file).pipe(
            tap((images) => {
              created.set(image.id, images.find((item) => !before.has(item.id))?.id ?? image.id);
              this.images.set(images);
              URL.revokeObjectURL(image.url);
              this.staged.update((list) => list.filter((item) => item.id !== image.id));
            }),
          );
        }),
      ),
      defer(() =>
        this.reorderIfNeeded(
          id,
          desired.map((entry) => created.get(entry) ?? entry),
        ),
      ),
    ).pipe(toArray());
  }
}
