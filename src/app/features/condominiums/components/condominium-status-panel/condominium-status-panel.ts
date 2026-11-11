import { TranslocoPipe } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ActionItem } from '../../../../shared/ui/action-list/action-item';
import { ActionList } from '../../../../shared/ui/action-list/action-list';
import { Card } from '../../../../shared/ui/card/card';
import { Condominium, CondominiumCounts } from '../../condominium.model';
import { StatusAction } from '../../condominium-status-actions';
import { CondominiumRequestTimeline } from '../condominium-request-timeline';
import { CondominiumStatusBadge } from '../condominium-status-badge';

@Component({
  selector: 'app-condominium-status-panel',
  imports: [
    TranslocoPipe,
    ActionItem,
    ActionList,
    Card,
    CondominiumRequestTimeline,
    CondominiumStatusBadge,
  ],
  templateUrl: './condominium-status-panel.html',
  styleUrl: './condominium-status-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CondominiumStatusPanel {
  readonly condominium = input.required<Condominium>();
  readonly counts = input<CondominiumCounts | null>(null);
  readonly statusActions = input<readonly StatusAction[]>([]);
  readonly membershipOpen = input(false);
  readonly busy = input(false);

  readonly toggleResidency = output<void>();
  readonly leaveManagement = output<void>();
  readonly changeStatus = output<StatusAction>();
}
