import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { RENTAL_STATUS_TONES } from '../../models/rental-status';
import { Badge } from '../../ui/badge/badge';
import { Button } from '../../ui/button/button';
import { FormActions } from '../../ui/form-actions/form-actions';
import { FormSection } from '../../ui/form-section/form-section';
import { RentalDetailsData } from '../rental-details';

@Component({
  selector: 'app-rental-details-dialog',
  imports: [TranslocoPipe, RouterLink, Badge, Button, FormActions, FormSection],
  templateUrl: './rental-details-dialog.html',
  styleUrl: './rental-details-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RentalDetailsDialog {
  protected readonly data = inject<RentalDetailsData>(DIALOG_DATA);
  protected readonly tones = RENTAL_STATUS_TONES;
  private readonly ref = inject<DialogRef<void>>(DialogRef);

  protected close(): void {
    this.ref.close();
  }
}
