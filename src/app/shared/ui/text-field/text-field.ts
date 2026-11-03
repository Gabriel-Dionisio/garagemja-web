import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { controlErrorMessage } from '../../forms/field-errors';
import { uniqueId } from '../../forms/unique-id';

@Component({
  selector: 'app-text-field',
  imports: [ReactiveFormsModule],
  templateUrl: './text-field.html',
  styleUrl: './text-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextField {
  readonly label = input.required<string>();
  readonly control = input.required<FormControl<string>>();
  readonly type = input<'text' | 'email' | 'tel' | 'search'>('text');
  readonly placeholder = input('');
  readonly autocomplete = input('off');
  readonly inputMode = input<'text' | 'numeric' | 'tel' | 'email' | 'search'>('text');
  readonly hint = input('');
  readonly maxLength = input<number | null>(null);
  readonly format = input<((value: string) => string) | null>(null);

  protected readonly id = uniqueId('field');
  protected readonly error = controlErrorMessage(this.control);
  protected readonly describedBy = computed(() => {
    const ids = [
      this.hint() && !this.error() ? `${this.id}-hint` : '',
      this.error() ? `${this.id}-error` : '',
    ];
    return ids.filter(Boolean).join(' ') || null;
  });

  protected applyFormat(event: Event): void {
    const format = this.format();
    if (!format) return;
    const element = event.target as HTMLInputElement;
    const caret = element.selectionStart;
    const formatted = format(element.value);
    if (formatted === element.value) return;
    const nextCaret = caret === null ? null : format(element.value.slice(0, caret)).length;
    this.control().setValue(formatted);
    if (nextCaret !== null) element.setSelectionRange(nextCaret, nextCaret);
  }
}
