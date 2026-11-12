import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-setting-row',
  templateUrl: './setting-row.html',
  styleUrl: './setting-row.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingRow {
  readonly label = input.required<string>();
  readonly hint = input<string>();
}
