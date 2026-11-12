import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  Observable,
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  of,
  switchMap,
} from 'rxjs';
import { uniqueId } from '../../forms/unique-id';
import { Icon } from '../icon/icon';

export interface LookupOption {
  id: string;
  label: string;
  detail?: string;
}

const DEBOUNCE_MS = 300;

@Component({
  selector: 'app-lookup-field',
  imports: [ReactiveFormsModule, Icon],
  templateUrl: './lookup-field.html',
  styleUrl: './lookup-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LookupField {
  readonly label = input.required<string>();
  readonly search = input.required<(term: string) => Observable<LookupOption[]>>();
  readonly selected = input<LookupOption | null>(null);
  readonly placeholder = input('');
  readonly hint = input('');
  readonly clearLabel = input('Limpar');
  readonly minLength = input(2);
  readonly picked = output<LookupOption>();
  readonly cleared = output<void>();

  protected readonly id = uniqueId('lookup');
  protected readonly control = new FormControl('', { nonNullable: true });
  protected readonly options = signal<LookupOption[]>([]);

  constructor() {
    this.control.valueChanges
      .pipe(
        map((value) => value.trim()),
        debounceTime(DEBOUNCE_MS),
        distinctUntilChanged(),
        switchMap((term) =>
          term.length < this.minLength()
            ? of([])
            : this.search()(term).pipe(catchError(() => of([]))),
        ),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe((options) => this.options.set(options));
  }

  protected pick(option: LookupOption): void {
    this.control.reset('', { emitEvent: false });
    this.options.set([]);
    this.picked.emit(option);
  }

  protected clear(): void {
    this.cleared.emit();
  }
}
