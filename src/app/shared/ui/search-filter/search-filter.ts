import { TranslocoPipe } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { applyWhileTyping } from '../../forms/apply-while-typing';
import { Button } from '../button/button';
import { TextField } from '../text-field/text-field';

@Component({
  selector: 'app-search-filter',
  imports: [TranslocoPipe, ReactiveFormsModule, Button, TextField],
  templateUrl: './search-filter.html',
  styleUrl: './search-filter.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchFilter {
  readonly label = input.required<string>();
  readonly maxLength = input(100);
  readonly searchChange = output<string>();

  protected readonly form = inject(NonNullableFormBuilder).group({ search: [''] });

  constructor() {
    applyWhileTyping(this.form, () => this.apply());
  }

  protected apply(): void {
    this.searchChange.emit(this.form.controls.search.value.trim());
  }

  protected clear(): void {
    this.form.reset();
    this.apply();
  }
}
