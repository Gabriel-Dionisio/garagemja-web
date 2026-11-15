import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged, filter, map, skip, startWith } from 'rxjs';

export const SEARCH_DEBOUNCE_MS = 300;

export function applyWhileTyping(form: FormGroup, apply: () => void): void {
  const snapshot = () =>
    JSON.stringify(
      Object.values(form.getRawValue()).map((value) =>
        typeof value === 'string' ? value.trim() : value,
      ),
    );
  form.valueChanges
    .pipe(
      debounceTime(SEARCH_DEBOUNCE_MS),
      map(snapshot),
      startWith(snapshot()),
      distinctUntilChanged(),
      skip(1),
      filter(() => form.valid),
      takeUntilDestroyed(),
    )
    .subscribe(apply);
}
