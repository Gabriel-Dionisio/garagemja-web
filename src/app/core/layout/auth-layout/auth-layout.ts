import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { filter, map, startWith } from 'rxjs';
import { BrandLogo } from '../../../shared/ui/brand-logo/brand-logo';
import { LanguageSwitcher } from '../../../shared/ui/language-switcher/language-switcher';

@Component({
  selector: 'app-auth-layout',
  imports: [LanguageSwitcher, RouterOutlet, BrandLogo, TranslocoPipe],
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.compact]': 'compact()' },
})
export class AuthLayout {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly compact = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      startWith(null),
      map(() => this.deepestBrand() !== 'full'),
    ),
    { initialValue: true },
  );

  private deepestBrand(): unknown {
    let current = this.route.snapshot;
    while (current.firstChild) current = current.firstChild;
    return current.data['brand'];
  }
}
