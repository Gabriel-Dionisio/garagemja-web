import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

export interface TabLink {
  link: string | readonly string[];
  label: string;
  exact?: boolean;
}

@Component({
  selector: 'app-tab-nav',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav [attr.aria-label]="label()">
      @for (tab of tabs(); track tab.label) {
        <a
          [routerLink]="tab.link"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: !!tab.exact }"
          ariaCurrentWhenActive="page"
          >{{ tab.label }}</a
        >
      }
    </nav>
  `,
  styles: `
    :host {
      display: block;
      margin-bottom: var(--space-4);
    }

    nav {
      display: flex;
      gap: var(--space-4);
      border-bottom: 1px solid var(--color-border);
    }

    a {
      display: inline-flex;
      align-items: center;
      min-height: 2.75rem;
      padding: 0 var(--space-1);
      border-bottom: 2px solid transparent;
      color: var(--color-text-muted);
      font-weight: 600;
      text-decoration: none;
    }

    a.active {
      border-bottom-color: var(--color-primary);
      color: var(--color-primary);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabNav {
  readonly tabs = input.required<readonly TabLink[]>();
  readonly label = input.required<string>();
}
