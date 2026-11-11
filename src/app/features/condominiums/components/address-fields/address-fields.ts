import { TranslocoPipe } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { formatUf } from '../../../../shared/forms/masks';
import { TextField } from '../../../../shared/ui/text-field/text-field';

export interface AddressControls {
  address: FormControl<string>;
  number: FormControl<string>;
  district: FormControl<string>;
  city: FormControl<string>;
  state: FormControl<string>;
}

@Component({
  selector: 'app-address-fields',
  imports: [TranslocoPipe, TextField],
  templateUrl: './address-fields.html',
  styleUrl: './address-fields.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddressFields {
  readonly controls = input.required<AddressControls>();

  protected readonly formatUf = formatUf;
}
