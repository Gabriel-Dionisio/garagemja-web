import { TranslocoPipe } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { applyWhileTyping } from '../../../../shared/forms/apply-while-typing';
import { Button } from '../../../../shared/ui/button/button';
import { TextField } from '../../../../shared/ui/text-field/text-field';

@Component({
  selector: 'app-parking-spot-filter',
  imports: [TranslocoPipe, ReactiveFormsModule, Button, TextField],
  templateUrl: './parking-spot-filter.html',
  styleUrl: './parking-spot-filter.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParkingSpotFilterForm {
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
