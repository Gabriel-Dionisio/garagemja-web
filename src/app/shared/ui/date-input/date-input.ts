import {
  Directive,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { LocaleService } from '../../../core/i18n/locale-service';
import {
  DatePart,
  clampDay,
  datePatternFor,
  displayToIso,
  isoToDisplay,
  maskDate,
  shiftDate,
  todayIso,
} from '../../forms/date-format';

export type DateInputState = 'empty' | 'partial' | 'valid' | 'invalid' | 'out-of-range';

@Directive({
  selector: 'input[appDateInput]',
  host: {
    type: 'text',
    inputmode: 'numeric',
    maxlength: '10',
    autocomplete: 'off',
    '[placeholder]': 'pattern().toLowerCase()',
    '[attr.aria-invalid]': "state() === 'invalid' || state() === 'out-of-range' ? 'true' : null",
    '(input)': 'onInput()',
    '(blur)': 'touched.set(true)',
    '(keydown)': 'onKey($event)',
  },
})
export class DateInput {
  private readonly element = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;

  readonly isoValue = model('');
  readonly isoMin = input<string | null>(null);
  readonly isoMax = input<string | null>(null);

  readonly state = signal<DateInputState>('empty');
  readonly touched = signal(false);

  private readonly locale = inject(LocaleService);
  private emitted = '';
  private shown = this.locale.language();

  protected readonly pattern = computed(() => datePatternFor(this.locale.language()));

  constructor() {
    effect(() => {
      const pattern = this.pattern();
      const value = this.isoValue();
      const language = this.locale.language();
      if (value !== this.emitted || language !== this.shown) {
        this.element.value = isoToDisplay(value, pattern);
        this.emitted = value;
        this.shown = language;
      }
      this.refreshState();
    });
  }

  protected onInput(): void {
    this.element.value = clampDay(maskDate(this.element.value, this.pattern()), this.pattern());
    const iso = displayToIso(this.element.value, this.pattern()) ?? '';
    this.emitted = iso && this.inRange(iso) ? iso : '';
    this.isoValue.set(this.emitted);
    this.refreshState();
  }

  protected onKey(event: KeyboardEvent): void {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    const caret = this.element.selectionStart ?? 0;
    const current = displayToIso(this.element.value, this.pattern());
    const next = current
      ? shiftDate(current, this.partAt(caret), event.key === 'ArrowUp' ? 1 : -1)
      : todayIso();
    if (!next || !this.inRange(next)) return;
    this.element.value = isoToDisplay(next, this.pattern());
    this.element.setSelectionRange(caret, caret);
    this.emitted = next;
    this.isoValue.set(next);
    this.refreshState();
  }

  private refreshState(): void {
    const text = this.element.value;
    const iso = displayToIso(text, this.pattern());
    if (!text) this.state.set('empty');
    else if (iso) this.state.set(this.inRange(iso) ? 'valid' : 'out-of-range');
    else this.state.set(text.length === 10 ? 'invalid' : 'partial');
  }

  private partAt(caret: number): DatePart {
    if (caret > 5) return 'year';
    const first = this.pattern() === 'MM/dd/yyyy' ? 'month' : 'day';
    const second = first === 'day' ? 'month' : 'day';
    return caret <= 2 ? first : second;
  }

  private inRange(iso: string): boolean {
    const min = this.isoMin();
    const max = this.isoMax();
    return (!min || iso >= min) && (!max || iso <= max);
  }
}
