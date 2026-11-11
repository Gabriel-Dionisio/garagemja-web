import { TranslocoPipe } from '@jsverse/transloco';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AddressFields } from '../../components/address-fields/address-fields';
import { CondominiumImages } from '../../components/condominium-images/condominium-images';
import { CondominiumStatusPanel } from '../../components/condominium-status-panel/condominium-status-panel';
import { CondominiumInfo } from '../../components/condominium-info/condominium-info';
import { CondominiumTabs } from '../../../../shared/ui/condominium-tabs/condominium-tabs';
import { Dialog } from '@angular/cdk/dialog';
import { Router, RouterLink } from '@angular/router';
import {
  EMPTY,
  Observable,
  catchError,
  concatMap,
  distinctUntilChanged,
  finalize,
  forkJoin,
  map,
  of,
  switchMap,
} from 'rxjs';
import { AuthService } from '../../../../core/auth/auth-service';
import { ErrorText } from '../../../../core/i18n/error-text';
import { Checkbox } from '../../../../shared/ui/checkbox/checkbox';
import { AutofocusFirst } from '../../../../shared/forms/autofocus-first';
import { cnpjValidator } from '../../../../shared/forms/cnpj';
import { setServerErrors } from '../../../../shared/forms/field-errors';
import { focusFirstInvalid } from '../../../../shared/forms/focus-first-invalid';
import {
  formatCep,
  formatCnpj,
  formatNameInput,
  formatUf,
  onlyCnpj,
  onlyDigits,
} from '../../../../shared/forms/masks';
import { autofillCondominium } from '../../../../shared/lookup/address-autofill';
import { toApiError } from '../../../../shared/models/api-error.mapper';
import { Alert } from '../../../../shared/ui/alert/alert';
import { Button } from '../../../../shared/ui/button/button';
import { Card } from '../../../../shared/ui/card/card';
import { ConfirmService } from '../../../../shared/ui/confirm-dialog/confirm-service';
import { FormActions } from '../../../../shared/ui/form-actions/form-actions';
import { FormSection } from '../../../../shared/ui/form-section/form-section';
import { LoadingBlock } from '../../../../shared/ui/loading-block/loading-block';
import { Page as PageLayout } from '../../../../shared/ui/page/page';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { TextField } from '../../../../shared/ui/text-field/text-field';
import { JoinDialog } from '../../components/join-dialog/join-dialog';
import {
  Condominium,
  CondominiumCounts,
  CondominiumImage,
  CondominiumRules,
} from '../../condominium.model';
import { CondominiumsApi } from '../../data/condominiums-api';
import { STATUS_ACTIONS, StatusAction, askStatusChange } from '../../condominium-status-actions';

const optional = (value: string): string | undefined => value.trim() || undefined;

@Component({
  selector: 'app-condominium-form-page',
  imports: [
    AddressFields,
    CondominiumImages,
    CondominiumInfo,
    CondominiumStatusPanel,
    CondominiumTabs,
    Checkbox,
    AutofocusFirst,
    TranslocoPipe,
    ReactiveFormsModule,
    RouterLink,
    Alert,
    Button,
    Card,
    FormActions,
    FormSection,
    LoadingBlock,
    PageHeader,
    PageLayout,
    TextField,
  ],
  templateUrl: './condominium-form-page.html',
  styleUrl: './condominium-form-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CondominiumFormPage {
  private readonly api = inject(CondominiumsApi);
  private readonly auth = inject(AuthService);
  private readonly confirm = inject(ConfirmService);
  private readonly errorText = inject(ErrorText);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly dialog = inject(Dialog);

  private readonly imageEditor = viewChild(CondominiumImages);

  readonly id = input<string>();
  readonly from = input<string>();
  protected readonly backLink = computed(() => '/condominiums');

  protected readonly formatCnpj = formatCnpj;
  protected readonly formatCep = formatCep;
  protected readonly formatUf = formatUf;
  protected readonly formatName = (value: string) => formatNameInput(value);
  protected readonly condominium = signal<Condominium | null>(null);
  protected readonly loading = signal(this.id() !== undefined);
  protected readonly busy = signal(false);
  protected readonly saved = signal(false);
  protected readonly error = this.errorText.state({
    403: 'errors.condominium.forbidden',
    404: 'errors.condominium.notFound',
  });
  protected readonly rules = signal<CondominiumRules | null>(null);
  protected readonly images = signal<CondominiumImage[]>([]);
  protected readonly counts = signal<CondominiumCounts | null>(null);
  protected readonly isAdmin = computed(() => this.auth.hasRole('ADMIN'));
  protected readonly editing = computed(() => this.id() !== undefined);
  protected readonly residentView = computed(() => {
    const current = this.condominium();
    return current && !current.canManage && !this.isAdmin() ? current : null;
  });
  protected readonly statusActions = computed(() => {
    const current = this.condominium();
    return this.isAdmin() && current ? STATUS_ACTIONS[current.status] : [];
  });
  protected readonly membershipOpen = computed(() => this.canOpenManagers() && !this.isAdmin());
  protected readonly canOpenManagers = computed(() => {
    const current = this.condominium();
    if (!current || (current.status !== 'ACTIVE' && current.status !== 'BLOCKED')) return false;
    return this.isAdmin() || current.canManage;
  });
  protected readonly showTabs = computed(() => {
    const current = this.condominium();
    return !!current && (current.canManage || this.isAdmin());
  });
  protected readonly canOpenResidents = computed(
    () => this.canOpenManagers() && !this.isAdmin() && this.condominium()?.canManage === true,
  );
  protected readonly hasHistory = computed(() => this.condominium()?.status !== 'PENDING');
  protected readonly canEdit = computed(() => {
    const current = this.condominium();
    if (!this.editing()) return true;
    return (
      current?.canManage === true && current.status !== 'BLOCKED' && current.status !== 'CLOSED'
    );
  });
  protected readonly canChangeImage = computed(() => {
    const current = this.condominium();
    return this.canEdit() && current?.status !== 'BLOCKED' && current?.status !== 'CLOSED';
  });
  protected readonly canDelete = computed(() => {
    const current = this.condominium();
    if (!current?.canManage) return false;
    return current.status === 'PENDING' || current.status === 'REJECTED';
  });
  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    cnpj: ['', [Validators.required, cnpjValidator]],
    zipCode: ['', [Validators.pattern(/^\d{5}-?\d{3}$/)]],
    address: ['', [Validators.maxLength(255)]],
    district: ['', [Validators.maxLength(100)]],
    number: ['', [Validators.maxLength(20)]],
    city: ['', [Validators.maxLength(100)]],
    state: ['', [Validators.minLength(2), Validators.maxLength(2)]],
  });
  protected readonly dirty = toSignal(this.form.events.pipe(map(() => this.form.dirty)), {
    initialValue: false,
  });
  protected readonly notResident = new FormControl(false, { nonNullable: true });
  protected readonly autofill = autofillCondominium(this.form);
  protected readonly existing = signal<Condominium | null>(null);
  protected readonly requested = signal(false);

  constructor() {
    this.form.controls.cnpj.valueChanges
      .pipe(
        map((value) => onlyCnpj(value)),
        distinctUntilChanged(),
        switchMap((cnpj) =>
          cnpj.length === 14 && this.form.controls.cnpj.valid && !this.id()
            ? this.api.findByCnpj(cnpj).pipe(catchError(() => of(null)))
            : of(null),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((found) => this.existing.set(found));

    toObservable(this.id)
      .pipe(
        switchMap((id) => {
          if (id === undefined) return EMPTY;
          this.loading.set(true);
          this.error.clear();
          return this.api.get(id).pipe(
            switchMap((condominium) =>
              forkJoin({
                images: this.api.images(id),
                counts: this.canReadCounts(condominium) ? this.api.counts(id) : of(null),
                rules:
                  !condominium.canManage && !this.isAdmin()
                    ? this.api.rules(id).pipe(catchError(() => of(null)))
                    : of(null),
              }).pipe(map((extra) => ({ condominium, ...extra }))),
            ),
            catchError((error: unknown) => {
              this.error.setFrom(error);
              this.loading.set(false);
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe(({ condominium, images, counts, rules }) => {
        this.setCondominium(condominium);
        this.images.set(images);
        this.counts.set(counts);
        this.rules.set(rules);
        this.loading.set(false);
      });
  }

  private commitImages(id: string): Observable<unknown> {
    return this.imageEditor()?.commit(id) ?? of(null);
  }

  private canReadCounts(condominium: Condominium): boolean {
    if (this.isAdmin()) return true;
    return condominium.canManage && condominium.status !== 'PENDING';
  }

  protected submit(): void {
    if (this.busy()) return;
    if (this.form.invalid) {
      this.form.markAllAsDirty();
      this.form.markAllAsTouched();
      focusFirstInvalid(this.host.nativeElement);
      return;
    }
    const { name, cnpj, zipCode, address, district, number, city, state } = this.form.getRawValue();
    const fields = {
      name: name.trim(),
      address: optional(address),
      district: optional(district),
      number: optional(number),
      city: optional(city),
      state: optional(state),
      zipCode: optional(onlyDigits(zipCode)),
    };
    const id = this.id();
    const request = id
      ? this.api
          .update(id, fields)
          .pipe(concatMap((updated) => this.commitImages(id).pipe(map(() => updated))))
      : this.api
          .create({
            ...fields,
            cnpj: onlyCnpj(cnpj),
            requesterResides: !this.notResident.value,
          })
          .pipe(concatMap((created) => this.commitImages(created.id).pipe(map(() => created))));
    this.busy.set(true);
    this.saved.set(false);
    this.error.clear();
    request
      .pipe(
        finalize(() => this.busy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (condominium) => {
          if (id) {
            this.setCondominium(condominium);
            this.saved.set(true);
          } else {
            void this.router.navigate(['/condominiums', condominium.id]);
          }
        },
        error: (error: unknown) => this.fail(error),
      });
  }

  protected changeStatus(action: StatusAction): void {
    const current = this.condominium();
    if (!current || this.busy()) return;
    this.busy.set(true);
    this.saved.set(false);
    this.error.clear();
    askStatusChange(this.confirm, action, current.name)
      .pipe(
        switchMap((statusReason) =>
          statusReason === null
            ? EMPTY
            : this.api.update(current.id, {
                status: action.status,
                statusReason: statusReason || undefined,
              }),
        ),
        finalize(() => this.busy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (updated) => this.setCondominium(updated),
        error: (error: unknown) => this.fail(error),
      });
  }

  protected toggleResidency(): void {
    const current = this.condominium();
    if (!current || this.busy()) return;
    const leaving = current.resides;
    this.run(
      leaving
        ? this.confirm.confirm({
            title: 'condominiums.membership.leaveResidencyDialog.title',
            message: 'condominiums.membership.leaveResidencyDialog.message',
            params: { name: current.name },
            confirmLabel: 'condominiums.membership.leaveResidencyDialog.confirm',
            danger: true,
          })
        : of(true),
      () =>
        leaving ? this.api.leaveManagerResidency(current.id) : this.api.becomeResident(current.id),
      () => this.condominium.update((value) => value && { ...value, resides: !leaving }),
    );
  }

  protected leaveManagement(): void {
    const current = this.condominium();
    const userId = this.auth.user()?.id;
    if (!current || !userId || this.busy()) return;
    this.run(
      this.confirm.confirm({
        title: 'condominiums.membership.leaveManagementDialog.title',
        message: 'condominiums.membership.leaveManagementDialog.message',
        params: { name: current.name },
        confirmLabel: 'condominiums.membership.leaveManagementDialog.confirm',
        danger: true,
      }),
      () => this.api.removeManager(current.id, userId),
      () => void this.router.navigate(['/condominiums']),
    );
  }

  protected remove(): void {
    const current = this.condominium();
    if (!current || this.busy()) return;
    this.run(
      this.confirm.confirm({
        title: 'condominiums.dialog.delete.title',
        message: 'condominiums.dialog.delete.message',
        params: { name: current.name },
        confirmLabel: 'condominiums.dialog.delete.confirm',
        danger: true,
      }),
      () => this.api.remove(current.id),
      () => void this.router.navigate(['/condominiums/managed']),
    );
  }

  private run<T>(
    confirmed$: Observable<boolean>,
    call: () => Observable<T>,
    onDone: (result: T) => void,
  ): void {
    this.busy.set(true);
    this.saved.set(false);
    this.error.clear();
    confirmed$
      .pipe(
        switchMap((confirmed) => (confirmed ? call() : EMPTY)),
        finalize(() => this.busy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({ next: onDone, error: (error: unknown) => this.fail(error) });
  }

  protected requestManagement(found: Condominium): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.clear();
    this.api
      .requestManagement(found.id)
      .pipe(
        finalize(() => this.busy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.requested.set(true),
        error: (error: unknown) => this.fail(error),
      });
  }

  protected joinAsResident(found: Condominium): void {
    this.dialog
      .open<boolean>(JoinDialog, {
        data: { mode: 'cnpj', cnpj: found.cnpj ?? onlyCnpj(this.form.controls.cnpj.value) },
        ariaLabelledBy: 'join-title',
      })
      .closed.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((joined) => {
        if (joined) void this.router.navigate(['/condominiums']);
      });
  }

  protected leaveResidency(): void {
    const current = this.condominium();
    const residency = current?.residency;
    if (!current || !residency) return;
    this.run(
      this.confirm.confirm({
        title: 'condominiums.residencies.leave.title',
        message: 'condominiums.residencies.leave.message',
        params: { name: current.name },
        confirmLabel: 'condominiums.residencies.leave.confirm',
        danger: true,
      }),
      () => this.api.leaveResidency(residency.id),
      () => void this.router.navigate(['/condominiums']),
    );
  }

  private fail(error: unknown): void {
    const apiError = toApiError(error);
    if (setServerErrors(this.form.controls, apiError.fieldErrors)) {
      focusFirstInvalid(this.host.nativeElement);
    } else {
      this.error.set(apiError);
    }
  }

  private setCondominium(condominium: Condominium): void {
    this.condominium.set(condominium);
    this.form.reset({
      name: condominium.name,
      cnpj: formatCnpj(condominium.cnpj ?? ''),
      zipCode: formatCep(condominium.zipCode ?? ''),
      address: condominium.address ?? '',
      district: condominium.district ?? '',
      number: condominium.number ?? '',
      city: condominium.city ?? '',
      state: condominium.state ?? '',
    });
    if (this.canEdit()) {
      this.form.enable();
    } else {
      this.form.disable();
    }
    this.form.controls.cnpj.disable();
  }
}
