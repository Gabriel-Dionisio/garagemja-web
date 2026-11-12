import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { focusFirstInvalid } from '../../../../shared/forms/focus-first-invalid';
import { formatNameInput, formatPhone } from '../../../../shared/forms/masks';
import {
  formatPersonName,
  personNameValidator,
  phoneValidator,
} from '../../../../shared/forms/validators';
import { Button } from '../../../../shared/ui/button/button';
import { FormActions } from '../../../../shared/ui/form-actions/form-actions';
import { FormSection } from '../../../../shared/ui/form-section/form-section';
import { TextField } from '../../../../shared/ui/text-field/text-field';
import { Profile } from '../../profile.model';

export interface AccountValues {
  name: string;
  phone: string;
}

@Component({
  selector: 'app-account-form',
  imports: [TranslocoPipe, ReactiveFormsModule, Button, FormActions, FormSection, TextField],
  templateUrl: './account-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountForm {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly profile = input.required<Profile>();
  readonly showPhone = input(true);
  readonly saving = input(false);
  readonly save = output<AccountValues>();

  protected readonly formatName = formatNameInput;
  protected readonly formatPhone = formatPhone;
  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(150), personNameValidator]],
    phone: ['', [phoneValidator]],
  });

  constructor() {
    effect(() => {
      const { name, phone } = this.profile();
      this.form.reset({ name: formatPersonName(name), phone: formatPhone(phone) });
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      focusFirstInvalid(this.host.nativeElement);
      return;
    }
    this.save.emit(this.form.getRawValue());
  }
}
