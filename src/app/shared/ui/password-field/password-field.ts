import { TranslocoPipe } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CapsLock } from '../../forms/caps-lock';
import { formatPasswordInput } from '../../forms/masks';
import { controlChanges, controlErrorMessage, controlSettled } from '../../forms/field-errors';
import { uniqueId } from '../../forms/unique-id';
import { PASSWORD_MAX, PASSWORD_MIN, PASSWORD_RULES } from '../../forms/password-policy';
import { Icon, IconName } from '../icon/icon';

type RuleState = 'met' | 'unmet' | 'pending';
const RULE_ICONS: Record<RuleState, IconName> = { met: 'check', unmet: 'close', pending: 'dot' };

@Component({
  selector: 'app-password-field',
  imports: [TranslocoPipe, ReactiveFormsModule, Icon],
  templateUrl: './password-field.html',
  styleUrl: './password-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordField {
  readonly label = input.required<string>();
  readonly control = input.required<FormControl<string>>();
  readonly autocomplete = input<'current-password' | 'new-password'>('current-password');
  readonly hint = input('');
  readonly showRules = input(false);
  readonly matchWith = input<FormControl<string> | null>(null);

  protected readonly id = uniqueId('password');
  protected readonly visible = signal(false);
  private readonly capsLock = inject(CapsLock);
  protected readonly focused = signal(false);
  protected readonly capsWarning = computed(() => this.focused() && this.capsLock.active());
  protected readonly limits = { min: PASSWORD_MIN, max: PASSWORD_MAX };
  private readonly fieldError = controlErrorMessage(this.control);
  private readonly changes = controlChanges(this.control);
  private readonly settled = controlSettled(this.control);
  protected readonly rules = computed(() => {
    this.changes();
    const { value, dirty, touched } = this.control();
    const reveal = dirty && (this.settled() || touched);
    return PASSWORD_RULES.map(({ key, test }) => {
      const state: RuleState = test(value) ? 'met' : reveal ? 'unmet' : 'pending';
      return { name: key, state, icon: RULE_ICONS[state] };
    });
  });
  protected readonly missingRules = computed(() =>
    this.rules().filter((rule) => rule.state !== 'met'),
  );
  private readonly otherChanges = controlChanges(
    computed(() => this.matchWith() ?? this.control()),
  );
  protected readonly strength = computed(() => {
    const met = this.rules().filter((rule) => rule.state === 'met').length;
    const level = met === PASSWORD_RULES.length ? 'strong' : met >= 3 ? 'medium' : 'weak';
    return { met, level, visible: this.control().value.length > 0 };
  });
  protected readonly segments = PASSWORD_RULES.map((_, index) => index);
  protected readonly match = computed(() => {
    this.changes();
    this.otherChanges();
    const other = this.matchWith();
    const { value, dirty, touched } = this.control();
    if (!other || !value) return null;
    if (value === other.value) return { state: 'met' as const, icon: RULE_ICONS.met };
    const revealed = dirty && (this.settled() || touched);
    const stillTyping = !touched && other.value.startsWith(value);
    const state: RuleState = revealed && !stillTyping ? 'unmet' : 'pending';
    return { state, icon: RULE_ICONS[state] };
  });
  protected readonly error = computed(() =>
    (this.showRules() || this.matchWith()) && !this.control().errors?.['server']
      ? null
      : this.fieldError(),
  );
  protected readonly describedBy = computed(() => {
    const ids = [
      this.showRules() ? `${this.id}-rules` : '',
      this.match() ? `${this.id}-match` : '',
      this.hint() && !this.error() ? `${this.id}-hint` : '',
      this.error() ? `${this.id}-error` : '',
    ];
    return ids.filter(Boolean).join(' ') || null;
  });

  protected strip(): void {
    const control = this.control();
    const clean = formatPasswordInput(control.value);
    if (clean !== control.value) control.setValue(clean);
  }

  protected toggle(): void {
    this.visible.update((value) => !value);
  }
}
