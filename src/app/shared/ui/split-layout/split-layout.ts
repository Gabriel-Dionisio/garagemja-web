import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-split-layout',
  templateUrl: './split-layout.html',
  styleUrl: './split-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SplitLayout {}
