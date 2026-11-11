import { TranslocoPipe } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Button } from '../../../../shared/ui/button/button';
import { TextField } from '../../../../shared/ui/text-field/text-field';

@Component({
  selector: 'app-resident-filter',
  imports: [TranslocoPipe, ReactiveFormsModule, Button, TextField],
  templateUrl: './resident-filter.html',
  styleUrl: './resident-filter.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResidentFilterForm {
  readonly searchChange = output<string>();

  protected readonly form = inject(NonNullableFormBuilder).group({ search: [''] });

  protected apply(): void {
    this.searchChange.emit(this.form.controls.search.value.trim());
  }

  protected clear(): void {
    this.form.reset();
    this.apply();
  }
}
