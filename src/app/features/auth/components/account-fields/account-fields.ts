import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  formatCpf,
  formatEmailInput,
  formatNameInput,
  formatPhone,
} from '../../../../shared/forms/masks';
import { PasswordField } from '../../../../shared/ui/password-field/password-field';
import { TextField } from '../../../../shared/ui/text-field/text-field';
import { AccountForm } from '../account-form';

@Component({
  selector: 'app-account-fields',
  imports: [TranslocoPipe, PasswordField, TextField],
  templateUrl: './account-fields.html',
  styleUrl: './account-fields.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountFields {
  readonly form = input.required<AccountForm>();

  protected readonly formatCpf = formatCpf;
  protected readonly formatEmail = formatEmailInput;
  protected readonly formatName = formatNameInput;
  protected readonly formatPhone = formatPhone;
}
