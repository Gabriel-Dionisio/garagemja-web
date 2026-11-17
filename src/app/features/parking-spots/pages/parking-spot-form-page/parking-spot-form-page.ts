import { TranslocoPipe } from '@jsverse/transloco';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  EMPTY,
  Observable,
  catchError,
  concat,
  finalize,
  forkJoin,
  of,
  switchMap,
  toArray,
} from 'rxjs';
import { ErrorText } from '../../../../core/i18n/error-text';
import { formatSafeText } from '../../../../shared/forms/safe-text';
import { Alert } from '../../../../shared/ui/alert/alert';
import { Button } from '../../../../shared/ui/button/button';
import { Card } from '../../../../shared/ui/card/card';
import { ChipGroup, ChipOption } from '../../../../shared/ui/chip-group/chip-group';
import { ChipToggle } from '../../../../shared/ui/chip-toggle/chip-toggle';
import { CondominiumTabs } from '../../../../shared/ui/condominium-tabs/condominium-tabs';
import { FormActions } from '../../../../shared/ui/form-actions/form-actions';
import { FormSection } from '../../../../shared/ui/form-section/form-section';
import { ImageField, ImageItem } from '../../../../shared/ui/image-field/image-field';
import { LookupField, LookupOption } from '../../../../shared/ui/lookup-field/lookup-field';
import { Page as PageLayout } from '../../../../shared/ui/page/page';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { ConfirmService } from '../../../../shared/ui/confirm-dialog/confirm-service';
import { Skeleton } from '../../../../shared/ui/skeleton/skeleton';
import { SkeletonBlock } from '../../../../shared/ui/skeleton/skeleton-block';
import { TextField } from '../../../../shared/ui/text-field/text-field';
import { SpotAvailabilities } from '../../components/spot-availabilities/spot-availabilities';
import { ParkingSpotsApi } from '../../data/parking-spots-api';
import { PARKING_SPOT_SIZE_LABELS } from '../../parking-spot-status';
import {
  PARKING_SPOT_SIZES,
  ParkingSpot,
  ParkingSpotCondominium,
  ParkingSpotResidency,
  ParkingSpotSize,
} from '../../parking-spot.model';

const STAGED_PREFIX = 'staged-';
const MAX_IMAGES = 5;

interface StagedImage {
  id: string;
  file: File;
  url: string;
}

@Component({
  selector: 'app-parking-spot-form-page',
  imports: [
    CondominiumTabs,
    TranslocoPipe,
    ReactiveFormsModule,
    RouterLink,
    Alert,
    Button,
    Card,
    ChipGroup,
    ChipToggle,
    FormActions,
    FormSection,
    ImageField,
    LookupField,
    PageHeader,
    PageLayout,
    Skeleton,
    SkeletonBlock,
    SpotAvailabilities,
    TextField,
  ],
  templateUrl: './parking-spot-form-page.html',
  styleUrl: './parking-spot-form-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParkingSpotFormPage {
  private readonly api = inject(ParkingSpotsApi);
  private readonly errorText = inject(ErrorText);
  private readonly router = inject(Router);
  private readonly confirm = inject(ConfirmService);
  private readonly destroyRef = inject(DestroyRef);

  readonly id = input<string>();
  readonly spotId = input<string>();

  protected readonly sizeOptions: readonly ChipOption<ParkingSpotSize>[] = [
    { value: null, labelKey: 'parkingSpots.size.NONE' },
    ...PARKING_SPOT_SIZES.map((size) => ({
      value: size,
      labelKey: PARKING_SPOT_SIZE_LABELS[size],
    })),
  ];
  protected readonly formatText = formatSafeText;
  protected readonly condominium = signal<ParkingSpotCondominium | null>(null);
  protected readonly spot = signal<ParkingSpot | null>(null);
  protected readonly loading = signal(true);
  protected readonly busy = signal(false);
  protected readonly size = signal<ParkingSpotSize | null>(null);
  protected readonly covered = signal(false);
  protected readonly owner = signal<LookupOption | null>(null);
  private readonly serverImages = signal<ImageItem[]>([]);
  private readonly removedIds = signal<string[]>([]);
  private readonly formDirty = signal(false);
  private nextStaged = 0;
  protected readonly maxImages = MAX_IMAGES;
  protected readonly staged = signal<StagedImage[]>([]);
  protected readonly images = computed<ImageItem[]>(() => [
    ...this.serverImages().filter((image) => !this.removedIds().includes(image.id)),
    ...this.staged().map(({ id, url }) => ({ id, url })),
  ]);
  protected readonly dirty = computed(
    () => this.formDirty() || this.staged().length > 0 || this.removedIds().length > 0,
  );
  protected readonly residencies = signal<ParkingSpotResidency[]>([]);
  protected readonly choice = signal<string | null>(null);
  protected readonly error = this.errorText.state({
    403: 'errors.parkingSpots.forbidden',
    404: 'errors.parkingSpots.notFound',
    409: 'errors.parkingSpots.conflict',
  });

  protected readonly editing = computed(() => this.spotId() !== undefined);
  protected readonly successLink = computed(() => {
    const id = this.id();
    return id ? `/condominiums/${id}/parking-spots` : '/parking-spots';
  });
  protected readonly backLink = this.successLink;
  protected readonly canManage = computed(() => this.condominium()?.canManage === true);
  protected readonly condominiumId = computed(
    () => this.id() ?? this.spot()?.condominiumId ?? this.choice(),
  );
  protected readonly subtitle = computed(
    () =>
      this.condominium()?.name ??
      this.spot()?.condominiumName ??
      this.residencies().find((item) => item.condominiumId === this.choice())?.condominiumName ??
      '',
  );
  protected readonly choiceOptions = computed<readonly ChipOption<string>[]>(() =>
    this.residencies().map((item) => ({ value: item.condominiumId, label: item.condominiumName })),
  );
  protected readonly ready = computed(() => this.condominium() !== null || !this.id());
  protected readonly noResidency = computed(
    () => !this.id() && !this.editing() && this.residencies().length === 0,
  );
  protected readonly activeSpot = computed(() => {
    const current = this.spot();
    return current?.status === 'ACTIVE' ? current : null;
  });
  protected readonly pending = computed(() => !this.id() && this.spot()?.status === 'PENDING');
  protected readonly locked = computed(() => {
    const current = this.spot();
    return current !== null && !this.canManage() && current.status === 'REJECTED';
  });
  protected readonly searchOwners = (term: string) => this.api.owners(this.id() ?? '', term);
  protected readonly form = inject(NonNullableFormBuilder).group({
    number: ['', [Validators.required, Validators.maxLength(20)]],
    location: ['', [Validators.maxLength(100)]],
  });

  constructor() {
    this.form.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.formDirty.set(this.form.dirty));
    toObservable(computed(() => ({ id: this.id(), spotId: this.spotId() })))
      .pipe(
        switchMap(({ id, spotId }) => {
          this.loading.set(true);
          this.error.clear();
          return forkJoin({
            condominium: id ? this.api.condominium(id) : of(null),
            residencies: id || spotId ? of([]) : this.api.residencies(),
            spot: spotId ? this.api.get(spotId) : of(null),
            images: spotId ? this.api.images(spotId) : of([]),
          }).pipe(
            catchError((error: unknown) => {
              this.error.setFrom(error);
              this.loading.set(false);
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe(({ condominium, residencies, spot, images }) => {
        this.condominium.set(condominium);
        this.residencies.set(residencies);
        this.choice.set(residencies.length === 1 ? residencies[0].condominiumId : null);
        this.spot.set(spot);
        this.serverImages.set(images);
        this.removedIds.set([]);
        if (spot) this.fill(spot);
        this.loading.set(false);
      });
  }

  protected selectCondominium(condominiumId: string | null): void {
    this.choice.set(condominiumId);
  }

  protected toggleCovered(): void {
    this.covered.update((value) => !value);
    this.markDirty();
  }

  protected selectSize(size: ParkingSpotSize | null): void {
    this.size.set(size);
    this.markDirty();
  }

  protected pickOwner(option: LookupOption): void {
    this.owner.set(option);
    this.markDirty();
  }

  protected clearOwner(): void {
    this.owner.set(null);
    this.markDirty();
  }

  protected addImage(file: File): void {
    const id = `${STAGED_PREFIX}${this.nextStaged++}`;
    this.staged.update((items) => [...items, { id, file, url: URL.createObjectURL(file) }]);
  }

  protected removeImage(imageId: string): void {
    if (!imageId.startsWith(STAGED_PREFIX)) {
      this.removedIds.update((ids) => [...ids, imageId]);
      return;
    }
    const removed = this.staged().find((item) => item.id === imageId);
    if (removed) URL.revokeObjectURL(removed.url);
    this.staged.update((items) => items.filter((item) => item.id !== imageId));
  }

  protected submit(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach((control) => control.markAsDirty());
      this.form.markAllAsTouched();
      return;
    }
    const condominiumId = this.condominiumId();
    if (!condominiumId) return;
    const { number, location } = this.form.getRawValue();
    const input = {
      number: number.trim(),
      location: location.trim() || null,
      size: this.size(),
      covered: this.covered(),
      ownerResidentId: this.canManage() ? (this.owner()?.id ?? null) : null,
    };
    const spotId = this.spotId();
    const save$: Observable<unknown> = spotId
      ? this.api
          .update(spotId, { ...input, clearOwner: this.canManage() && !this.owner() })
          .pipe(switchMap(() => this.syncImages(spotId)))
      : this.api
          .create(condominiumId, input)
          .pipe(switchMap((created) => this.syncImages(created.id)));
    this.run(save$, () => void this.router.navigate([this.successLink()]));
  }

  protected cancelRequest(): void {
    const spot = this.spot();
    if (!spot) return;
    this.confirm
      .confirm({
        title: 'parkingSpots.confirm.cancel.title',
        message: 'parkingSpots.confirm.cancel.message',
        confirmLabel: 'parkingSpots.confirm.cancel.confirm',
        params: { number: spot.number },
        danger: true,
      })
      .pipe(
        switchMap((confirmed) => (confirmed ? this.api.remove(spot.id) : EMPTY)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => void this.router.navigate(['/parking-spots']),
        error: (error: unknown) => this.error.setFrom(error),
      });
  }

  private markDirty(): void {
    this.form.markAsDirty();
    this.formDirty.set(true);
  }

  private fill(spot: ParkingSpot): void {
    this.form.reset({ number: spot.number, location: spot.location ?? '' });
    this.formDirty.set(false);
    if (!this.canManage() && spot.status !== 'PENDING') this.form.controls.number.disable();
    this.size.set(spot.size);
    this.covered.set(spot.covered);
    this.owner.set(
      spot.owner
        ? {
            id: spot.owner.residentId,
            label: spot.owner.name,
            detail: [spot.owner.block, spot.owner.unit].filter(Boolean).join(' / '),
          }
        : null,
    );
  }

  private syncImages(spotId: string): Observable<unknown> {
    const removals = this.removedIds().map((id) => this.api.removeImage(spotId, id));
    const additions = this.staged().map(({ file }) =>
      this.api.addImage(spotId, file).pipe(catchError(() => of([]))),
    );
    return concat(...removals, ...additions).pipe(toArray());
  }

  private run<T>(call: Observable<T>, onDone: (value: T) => void): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.clear();
    call
      .pipe(
        finalize(() => this.busy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: onDone,
        error: (error: unknown) => this.error.setFrom(error),
      });
  }
}
