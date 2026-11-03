import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-form-actions',
  template: '<ng-content />',
  styleUrl: './form-actions.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormActions {}
