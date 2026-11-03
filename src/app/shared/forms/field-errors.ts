import { Signal, computed, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  TouchedChangeEvent,
  ValidationErrors,
  ValueChangeEvent,
} from '@angular/forms';
import { TranslocoService } from '@jsverse/transloco';
import { filter, map, of, startWith, switchMap, timer } from 'rxjs';
import { PASSWORD_MAX, PASSWORD_MIN } from './password-policy';

const TYPING_PAUSE_MS = 700;

const PARAM_KEYS = new Set(['maxlength', 'minlength']);

function errorText(transloco: TranslocoService, errors: ValidationErrors | null): string | null {
  const [key, detail] = Object.entries(errors ?? {})[0] ?? [];
  if (!key) return null;
  if (key === 'server') return String(detail);
  const translationKey = `errors.field.${key}`;
  const params = PARAM_KEYS.has(key)
    ? { n: (detail as { requiredLength: number }).requiredLength }
    : { min: PASSWORD_MIN, max: PASSWORD_MAX };
  const text = transloco.translate(translationKey, params);
  return text === translationKey ? transloco.translate('errors.field.invalid') : text;
}

export function controlChanges(control: Signal<AbstractControl>): Signal<unknown> {
  return toSignal(
    toObservable(control).pipe(switchMap((current) => current.events.pipe(startWith(null)))),
    { initialValue: null },
  );
}

export function controlSettled(control: Signal<AbstractControl>): Signal<boolean> {
  return toSignal(
    toObservable(control).pipe(
      switchMap((current) => current.events),
      filter((event) => event instanceof ValueChangeEvent || event instanceof TouchedChangeEvent),
      switchMap((event) =>
        event instanceof ValueChangeEvent
          ? timer(TYPING_PAUSE_MS).pipe(
              map(() => true),
              startWith(false),
            )
          : of(true),
      ),
    ),
    { initialValue: true },
  );
}

export function controlErrorMessage(control: Signal<AbstractControl>): Signal<string | null> {
  const transloco = inject(TranslocoService);
  const lang = toSignal(transloco.langChanges$);
  const changes = controlChanges(control);
  const settled = controlSettled(control);
  return computed(() => {
    changes();
    lang();
    const current = control();
    const ready = settled() || current.touched || current.errors?.['server'];
    return ready && current.dirty && current.invalid ? errorText(transloco, current.errors) : null;
  });
}

export function setServerErrors(
  controls: Record<string, AbstractControl>,
  fieldErrors: { field: string; message: string }[],
): boolean {
  let applied = false;
  for (const { field, message } of fieldErrors) {
    const control = controls[field];
    if (control) {
      control.setErrors({ server: message });
      control.markAsDirty();
      applied = true;
    }
  }
  return applied;
}
