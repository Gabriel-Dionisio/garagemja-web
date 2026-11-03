import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { Role } from '../../../../core/auth/auth.model';
import { ROLES, ROLE_LABELS } from '../../../../core/auth/role';
import { ChipToggle } from '../../../../shared/ui/chip-toggle/chip-toggle';

@Component({
  selector: 'app-role-picker',
  imports: [TranslocoPipe, ChipToggle],
  templateUrl: './role-picker.html',
  styleUrl: './role-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RolePicker {
  readonly group = input.required<FormGroup<Record<Role, FormControl<boolean>>>>();
  readonly missing = input(false);
  readonly changed = output<void>();

  protected readonly roles = ROLES;
  protected readonly labels = ROLE_LABELS;

  protected toggle(role: Role): void {
    const control = this.group().controls[role];
    control.setValue(!control.value);
    this.changed.emit();
  }
}
