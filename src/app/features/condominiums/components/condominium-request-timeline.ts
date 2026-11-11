import { TranslocoPipe } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CondominiumStatus } from '../condominium.model';

type StepState = 'done' | 'current' | 'failed' | 'todo';

interface Step {
  key: string;
  state: StepState;
}

@Component({
  selector: 'app-condominium-request-timeline',
  imports: [TranslocoPipe],
  template: `
    <ol [attr.aria-label]="'condominiums.timeline.label' | transloco">
      @for (step of steps(); track step.key) {
        <li
          [attr.data-state]="step.state"
          [attr.aria-current]="step.state === 'current' ? 'step' : null"
        >
          {{ 'condominiums.timeline.' + step.key | transloco }}
          <span class="sr-only">{{ 'condominiums.timeline.state.' + step.state | transloco }}</span>
        </li>
      }
    </ol>
    @if (reason(); as text) {
      <p>{{ 'condominiums.timeline.reason' | transloco: { reason: text } }}</p>
    } @else if (status() === 'PENDING') {
      <p>{{ 'condominiums.timeline.hint' | transloco }}</p>
    }
  `,
  styleUrl: './condominium-request-timeline.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CondominiumRequestTimeline {
  readonly status = input.required<CondominiumStatus>();
  readonly reason = input<string | null>(null);

  protected readonly steps = computed<Step[]>(() => {
    const received: Step = { key: 'received', state: 'done' };
    switch (this.status()) {
      case 'PENDING':
        return [received, { key: 'review', state: 'current' }, { key: 'approved', state: 'todo' }];
      case 'REJECTED':
        return [received, { key: 'review', state: 'done' }, { key: 'rejected', state: 'failed' }];
      case 'CLOSED':
        return [received, { key: 'approved', state: 'done' }, { key: 'closed', state: 'failed' }];
      default:
        return [received, { key: 'review', state: 'done' }, { key: 'approved', state: 'done' }];
    }
  });
}
