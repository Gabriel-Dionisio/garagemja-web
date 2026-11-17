import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { EMPTY, catchError, finalize, forkJoin, of, switchMap } from 'rxjs';
import { ErrorText } from '../../../../core/i18n/error-text';
import { AutofocusFirst } from '../../../../shared/forms/autofocus-first';
import { setServerErrors } from '../../../../shared/forms/field-errors';
import { focusFirstInvalid } from '../../../../shared/forms/focus-first-invalid';
import { toApiError } from '../../../../shared/models/api-error.mapper';
import { Alert } from '../../../../shared/ui/alert/alert';
import { Button } from '../../../../shared/ui/button/button';
import { Card } from '../../../../shared/ui/card/card';
import { FormActions } from '../../../../shared/ui/form-actions/form-actions';
import { FormSection } from '../../../../shared/ui/form-section/form-section';
import { Page } from '../../../../shared/ui/page/page';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { SelectField, SelectOption } from '../../../../shared/ui/select-field/select-field';
import { Skeleton } from '../../../../shared/ui/skeleton/skeleton';
import { SkeletonBlock } from '../../../../shared/ui/skeleton/skeleton-block';
import { TextField } from '../../../../shared/ui/text-field/text-field';
import { VehiclesApi } from '../../data/vehicles-api';
import { Residency } from '../../vehicle.model';
import { formatPlate, plateValidator } from '../../vehicle-plate';

const LIST_URL = '/vehicles';
const MAX_TEXT = 50;
const SKELETON_FIELDS = [1, 2, 3, 4];

function residencyLabel(residency: Residency): string {
  const unit = [residency.block, residency.unit].filter(Boolean).join(' / ');
  return unit ? `${residency.condominiumName} · ${unit}` : residency.condominiumName;
}

@Component({
  selector: 'app-vehicle-form-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslocoPipe,
    AutofocusFirst,
    Alert,
    Button,
    Card,
    FormActions,
    FormSection,
    Page,
    PageHeader,
    SelectField,
    Skeleton,
    SkeletonBlock,
    TextField,
  ],
  templateUrl: './vehicle-form-page.html',
  styleUrl: './vehicle-form-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VehicleFormPage {
  private readonly api = inject(VehiclesApi);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly id = input<string>();

  protected readonly listUrl = LIST_URL;
  protected readonly maxText = MAX_TEXT;
  protected readonly skeletonFields = SKELETON_FIELDS;
  protected readonly formatPlate = formatPlate;
  protected readonly editing = computed(() => this.id() !== undefined);
  protected readonly loading = signal(true);
  protected readonly busy = signal(false);
  protected readonly error = inject(ErrorText).state({
    403: 'vehicles.errors.forbidden',
    404: 'vehicles.errors.notFound',
  });
  protected readonly residencies = signal<Residency[]>([]);
  protected readonly options = computed<SelectOption[]>(() => {
    const items = this.residencies().map((residency) => ({
      value: residency.id,
      label: residencyLabel(residency),
    }));
    return items.length === 1 ? items : [{ value: '', label: 'vehicles.form.pick' }, ...items];
  });
  protected readonly noResidency = computed(
    () => !this.loading() && !this.editing() && this.residencies().length === 0,
  );
  protected readonly failedToLoad = signal(false);

  protected readonly form = this.fb.group({
    residentId: ['', [Validators.required]],
    brand: ['', [Validators.maxLength(MAX_TEXT)]],
    model: ['', [Validators.maxLength(MAX_TEXT)]],
    plate: ['', [Validators.required, plateValidator]],
    color: ['', [Validators.maxLength(MAX_TEXT)]],
  });

  constructor() {
    toObservable(this.id)
      .pipe(
        switchMap((id) => {
          this.loading.set(true);
          this.failedToLoad.set(false);
          this.error.clear();
          return forkJoin({
            residencies: this.api.residencies(),
            vehicle: id ? this.api.get(id) : of(null),
          }).pipe(
            catchError((error: unknown) => {
              this.error.setFrom(error);
              this.failedToLoad.set(true);
              this.loading.set(false);
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe(({ residencies, vehicle }) => {
        if (vehicle) {
          this.residencies.set(residencies.filter(({ id }) => id === vehicle.residentId));
          this.form.reset({
            residentId: vehicle.residentId,
            brand: vehicle.brand ?? '',
            model: vehicle.model ?? '',
            plate: vehicle.plate,
            color: vehicle.color ?? '',
          });
          this.form.controls.residentId.disable();
        } else {
          const approved = residencies.filter(({ approved }) => approved);
          this.residencies.set(approved);
          this.form.controls.residentId.setValue(approved.length === 1 ? approved[0].id : '');
        }
        this.loading.set(false);
      });
  }

  protected submit(): void {
    if (this.busy()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      focusFirstInvalid(this.host.nativeElement);
      return;
    }
    const { residentId, ...values } = this.form.getRawValue();
    const id = this.id();
    const request = id ? this.api.update(id, values) : this.api.create(residentId, values);
    this.busy.set(true);
    this.error.clear();
    request
      .pipe(
        finalize(() => this.busy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => void this.router.navigateByUrl(LIST_URL),
        error: (error: unknown) => this.fail(error),
      });
  }

  private fail(error: unknown): void {
    const apiError = toApiError(error);
    if (setServerErrors(this.form.controls, apiError.fieldErrors)) {
      focusFirstInvalid(this.host.nativeElement);
    } else {
      this.error.set(apiError);
    }
  }
}
