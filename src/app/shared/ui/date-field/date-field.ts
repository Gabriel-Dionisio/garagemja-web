import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LocaleService } from '../../../core/i18n/locale-service';
import {
  DateParts,
  MAX_YEAR,
  MIN_YEAR,
  daysInMonth,
  parseIso,
  todayIso,
  toIso,
} from '../../forms/date-format';
import { Icon } from '../icon/icon';
import { DateInput } from '../date-input/date-input';

let nextId = 0;
const GAP = 4;
const SHEET_QUERY = '(max-width: 620px)';

interface Day {
  iso: string;
  day: number;
  disabled: boolean;
}

@Component({
  selector: 'app-date-field',
  imports: [DateInput, Icon, TranslocoPipe],
  templateUrl: './date-field.html',
  styleUrl: './date-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(keydown.escape)': 'close()',
    '(window:resize)': 'open.set(false)',
  },
})
export class DateField {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);
  private readonly locale = inject(LocaleService);

  readonly isoValue = model('');
  readonly isoMin = input<string | null>(null);
  readonly isoMax = input<string | null>(null);
  readonly label = input.required<string>();
  readonly showLabel = input(false);

  private readonly input = viewChild.required(DateInput);

  protected readonly errorKey = computed(() => {
    const { state, touched } = this.input();
    if (state() === 'invalid') return 'dateField.invalid';
    if (state() === 'out-of-range') return 'dateField.outOfRange';
    return state() === 'partial' && touched() ? 'dateField.incomplete' : null;
  });
  protected readonly inputId = `date-input-${nextId}`;
  protected readonly errorId = `date-error-${nextId++}`;
  protected readonly open = signal(false);
  protected readonly position = signal<{ top: number; left: number } | null>(null);
  protected readonly view = signal<Pick<DateParts, 'year' | 'month'>>({ year: 2000, month: 1 });
  protected readonly today = todayIso();

  protected readonly monthTitle = computed(() =>
    new Intl.DateTimeFormat(this.locale.language(), { month: 'long', timeZone: 'UTC' }).format(
      new Date(Date.UTC(2000, this.view().month - 1, 1)),
    ),
  );

  protected readonly weekdays = computed(() => {
    const format = new Intl.DateTimeFormat(this.locale.language(), {
      weekday: 'narrow',
      timeZone: 'UTC',
    });
    return Array.from({ length: 7 }, (_, index) =>
      format.format(new Date(Date.UTC(2023, 0, 1 + index))),
    );
  });

  protected readonly blanks = computed(() => {
    const { year, month } = this.view();
    return Array.from({ length: new Date(Date.UTC(year, month - 1, 1)).getUTCDay() });
  });

  protected readonly days = computed<Day[]>(() => {
    const { year, month } = this.view();
    const min = this.isoMin();
    const max = this.isoMax();
    return Array.from({ length: daysInMonth(year, month) }, (_, index) => {
      const iso = toIso({ year, month, day: index + 1 });
      return { iso, day: index + 1, disabled: (!!min && iso < min) || (!!max && iso > max) };
    });
  });

  protected readonly canGoPreviousYear = computed(() => this.view().year > MIN_YEAR);
  protected readonly canGoNextYear = computed(() => this.view().year < MAX_YEAR);

  constructor() {
    const listener = (event: Event) => this.onScroll(event);
    document.addEventListener('scroll', listener, true);
    inject(DestroyRef).onDestroy(() => document.removeEventListener('scroll', listener, true));
  }

  protected toggle(): void {
    if (this.open()) {
      this.close();
      return;
    }
    const base = parseIso(this.isoValue()) ?? parseIso(todayIso());
    if (base) this.view.set({ year: base.year, month: base.month });
    this.position.set(null);
    this.open.set(true);
    afterNextRender(
      () => {
        this.place();
        this.host.querySelector<HTMLElement>('[data-focus="true"]:not(:disabled)')?.focus();
      },
      { injector: this.injector },
    );
  }

  // Fixed position keeps the popup visible inside dialogs and scroll areas that clip overflow.
  private place(): void {
    const popup = this.host.querySelector<HTMLElement>('.popup');
    const field = this.host.querySelector<HTMLElement>('.field');
    if (!popup || !field || window.matchMedia?.(SHEET_QUERY).matches) return;
    const rect = field.getBoundingClientRect();
    const { offsetWidth: width, offsetHeight: height } = popup;
    const fitsBelow = rect.bottom + GAP + height <= window.innerHeight - GAP;
    const top = fitsBelow ? rect.bottom + GAP : Math.max(GAP, rect.top - GAP - height);
    const left = Math.max(GAP, Math.min(rect.left, window.innerWidth - width - GAP));
    this.position.set({ top, left });
  }

  private onScroll(event: Event): void {
    const target = event.target;
    if (this.open() && !(target instanceof Node && this.host.contains(target)))
      this.open.set(false);
  }

  protected close(): void {
    if (!this.open()) return;
    this.open.set(false);
    this.host.querySelector<HTMLElement>('.toggle')?.focus();
  }

  protected shiftMonth(delta: number): void {
    const { year, month } = this.view();
    const index = year * 12 + month - 1 + delta;
    this.setView(Math.floor(index / 12), (index % 12) + 1);
  }

  protected shiftYear(delta: number): void {
    const { year, month } = this.view();
    this.setView(year + delta, month);
  }

  protected pick(iso: string): void {
    this.isoValue.set(iso);
    this.close();
  }

  protected pickToday(): void {
    const min = this.isoMin();
    const max = this.isoMax();
    if ((min && this.today < min) || (max && this.today > max)) return;
    this.pick(this.today);
  }

  protected onDocumentClick(event: Event): void {
    if (this.open() && !this.host.contains(event.target as Node)) this.open.set(false);
  }

  private setView(year: number, month: number): void {
    if (year < MIN_YEAR || year > MAX_YEAR) return;
    this.view.set({ year, month });
  }
}
