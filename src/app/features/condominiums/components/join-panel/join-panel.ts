import { TranslocoPipe } from '@jsverse/transloco';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  EMPTY,
  Observable,
  catchError,
  distinctUntilChanged,
  finalize,
  map,
  switchMap,
  tap,
} from 'rxjs';
import { ErrorText } from '../../../../core/i18n/error-text';
import { cnpjValidator } from '../../../../shared/forms/cnpj';
import { formatCnpj, onlyCnpj } from '../../../../shared/forms/masks';
import { Alert } from '../../../../shared/ui/alert/alert';
import { Button } from '../../../../shared/ui/button/button';
import { FormActions } from '../../../../shared/ui/form-actions/form-actions';
import { LoadingBlock } from '../../../../shared/ui/loading-block/loading-block';
import { TextField } from '../../../../shared/ui/text-field/text-field';
import { CondominiumLookup } from '../../condominium.model';
import { CondominiumsApi } from '../../data/condominiums-api';

const CODE_LENGTH = 10;
const CNPJ_LENGTH = 14;

export type JoinMode = 'code' | 'cnpj';

@Component({
  selector: 'app-join-panel',
  imports: [
    TranslocoPipe,
    ReactiveFormsModule,
    Alert,
    Button,
    FormActions,
    LoadingBlock,
    TextField,
  ],
  templateUrl: './join-panel.html',
  styleUrl: './join-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JoinPanel {
  private readonly api = inject(CondominiumsApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly errorText = inject(ErrorText);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly mode = input<JoinMode>('code');
  readonly code = input<string>();
  readonly cnpj = input<string>();
  readonly joined = output<void>();

  protected readonly preview = signal<CondominiumLookup | null>(null);
  protected readonly notFound = signal(false);
  protected readonly loading = signal(false);
  protected readonly busy = signal(false);
  protected readonly error = this.errorText.state();
  protected readonly typed = this.fb.control('');
  protected readonly unit = this.fb.control('', [Validators.required, Validators.maxLength(20)]);
  protected readonly block = this.fb.control('', [Validators.maxLength(20)]);
  protected readonly byCnpj = computed(() => this.mode() === 'cnpj');
  protected readonly format = computed(() => (this.byCnpj() ? formatCnpj : formatCode));

  constructor() {
    effect(() => {
      const initial = this.byCnpj() ? this.cnpj() : this.code();
      if (initial) this.typed.setValue(this.format()(initial));
    });

    this.typed.valueChanges
      .pipe(
        map((value) => this.completeKey(value)),
        distinctUntilChanged(),
        tap(() => {
          this.notFound.set(false);
          this.preview.set(null);
          this.error.clear();
        }),
        switchMap((key) => {
          if (!key) return EMPTY;
          this.loading.set(true);
          return this.find(key).pipe(
            catchError((error: unknown) => {
              this.error.setFrom(error);
              return EMPTY;
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((found) => {
        this.preview.set(found);
        this.notFound.set(found === null);
      });
  }

  protected submit(): void {
    if (this.busy() || !this.preview()) return;
    if (this.unit.invalid || this.block.invalid) {
      this.unit.markAsTouched();
      this.block.markAsTouched();
      return;
    }
    const request = {
      unit: this.unit.value.trim(),
      block: this.block.value.trim() || undefined,
    };
    const value = this.typed.value;
    this.busy.set(true);
    this.error.clear();
    (this.byCnpj() ? this.api.joinByCnpj(onlyCnpj(value), request) : this.api.join(value, request))
      .pipe(
        finalize(() => this.busy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.reset();
          this.joined.emit();
        },
        error: (error: unknown) => this.error.setFrom(error),
      });
  }

  private completeKey(value: string): string | null {
    if (!this.byCnpj()) return value.length === CODE_LENGTH ? value : null;
    const digits = onlyCnpj(value);
    return digits.length === CNPJ_LENGTH && cnpjValidator(this.typed) === null ? digits : null;
  }

  private find(key: string): Observable<CondominiumLookup | null> {
    return this.byCnpj() ? this.api.lookup(key) : this.api.previewJoin(key);
  }

  private reset(): void {
    this.typed.reset('');
    this.unit.reset('');
    this.block.reset('');
  }
}

function formatCode(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-HJKMNP-Z2-9]/g, '')
    .slice(0, CODE_LENGTH);
}
