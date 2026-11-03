import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { controlErrorMessage } from '../../forms/field-errors';
import { uniqueId } from '../../forms/unique-id';

export interface SelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-select-field',
  imports: [ReactiveFormsModule, TranslocoPipe],
  templateUrl: './select-field.html',
  styleUrl: './select-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectField {
  readonly label = input.required<string>();
  readonly control = input.required<FormControl<string>>();
  readonly options = input.required<SelectOption[]>();

  protected readonly id = uniqueId('select');
  protected readonly error = controlErrorMessage(this.control);
  protected readonly describedBy = computed(() => (this.error() ? `${this.id}-error` : null));
}
