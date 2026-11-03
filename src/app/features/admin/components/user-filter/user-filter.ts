import { TranslocoPipe } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { formatCpf, formatEmailInput, onlyDigits } from '../../../../shared/forms/masks';
import { cpfValidator } from '../../../../shared/forms/cpf';
import { Button } from '../../../../shared/ui/button/button';
import { TextField } from '../../../../shared/ui/text-field/text-field';
import { UserFilter } from '../../user.model';

@Component({
  selector: 'app-user-filter',
  imports: [TranslocoPipe, ReactiveFormsModule, Button, TextField],
  templateUrl: './user-filter.html',
  styleUrl: './user-filter.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserFilterForm {
  readonly filterChange = output<UserFilter>();

  protected readonly formatCpf = formatCpf;
  protected readonly formatEmail = formatEmailInput;
  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.email]],
    cpf: ['', [cpfValidator]],
  });

  protected apply(): void {
    if (this.form.invalid) {
      this.form.markAllAsDirty();
      this.form.markAllAsTouched();
      return;
    }
    const { email, cpf } = this.form.getRawValue();
    this.filterChange.emit({ email: email.trim(), cpf: onlyDigits(cpf) });
  }

  protected clear(): void {
    this.form.reset();
    this.filterChange.emit({ email: '', cpf: '' });
  }
}
