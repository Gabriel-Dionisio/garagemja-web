import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { uniqueId } from '../../forms/unique-id';

@Component({
  selector: 'app-checkbox',
  imports: [ReactiveFormsModule],
  templateUrl: './checkbox.html',
  styleUrl: './checkbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Checkbox {
  readonly label = input.required<string>();
  readonly control = input.required<FormControl<boolean>>();

  protected readonly id = uniqueId('checkbox');
}
