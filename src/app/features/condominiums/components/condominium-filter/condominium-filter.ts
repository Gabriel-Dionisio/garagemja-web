import { TranslocoPipe } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { formatUf } from '../../../../shared/forms/masks';
import { Button } from '../../../../shared/ui/button/button';
import { TextField } from '../../../../shared/ui/text-field/text-field';
import { CondominiumFilter } from '../../condominium.model';

@Component({
  selector: 'app-condominium-filter',
  imports: [TranslocoPipe, ReactiveFormsModule, Button, TextField],
  templateUrl: './condominium-filter.html',
  styleUrl: './condominium-filter.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CondominiumFilterForm {
  readonly filterChange = output<CondominiumFilter>();

  protected readonly formatUf = formatUf;
  protected readonly form = inject(NonNullableFormBuilder).group({
    name: [''],
    city: [''],
    state: [''],
  });

  protected apply(): void {
    const { name, city, state } = this.form.getRawValue();
    this.filterChange.emit({ name: name.trim(), city: city.trim(), state });
  }

  protected clear(): void {
    this.form.reset();
    this.apply();
  }
}
