import { TranslocoPipe } from '@jsverse/transloco';
import { ErrorText } from '../../i18n/error-text';
import { A11yModule } from '@angular/cdk/a11y';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  ActivatedRoute,
  ActivatedRouteSnapshot,
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { Alert } from '../../../shared/ui/alert/alert';
import { Badge } from '../../../shared/ui/badge/badge';
import { BrandLogo } from '../../../shared/ui/brand-logo/brand-logo';
import { CondominiumTabsState } from '../../../shared/ui/condominium-tabs/condominium-tabs-state';
import { Icon } from '../../../shared/ui/icon/icon';
import { AuthService } from '../../auth/auth-service';
import { NavBadges } from '../nav-badges';
import { navItemsFor } from '../nav-items';
import { UserMenu } from '../user-menu/user-menu';
import { ViewportService } from '../viewport-service';

@Component({
  selector: 'app-shell-layout',
  imports: [
    TranslocoPipe,
    A11yModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    Alert,
    Badge,
    BrandLogo,
    Icon,
    UserMenu,
  ],
  templateUrl: './shell-layout.html',
  styleUrl: './shell-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellLayout {
  private readonly auth = inject(AuthService);
  private readonly errorText = inject(ErrorText);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly mainElement = viewChild.required<ElementRef<HTMLElement>>('main');
  private readonly menuButton = viewChild<ElementRef<HTMLButtonElement>>('menuButton');

  private readonly navBadges = inject(NavBadges);

  protected readonly viewport = inject(ViewportService);
  protected readonly badgeCount = this.navBadges.condominiums;
  protected readonly user = this.auth.user;

  protected readonly homeLink = computed(() =>
    this.auth.hasRole('ADMIN') ? '/dashboard' : '/home',
  );
  protected readonly items = computed(() => navItemsFor(this.user()?.roles ?? []));
  protected readonly mainItems = computed(() => this.items().filter((item) => !item.group));
  protected readonly managementItems = computed(() => this.items().filter((item) => item.group));
  protected readonly showSearch = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      startWith(null),
      map(() => this.routeFlag('showSearch')),
    ),
    { initialValue: false },
  );
  protected readonly drawerOpen = signal(false);
  protected readonly logoutError = this.errorText.state();
  protected readonly loggingOut = signal(false);
  protected readonly showSidebar = computed(() => !this.viewport.usesDrawer() || this.drawerOpen());

  constructor() {
    const tabsState = inject(CondominiumTabsState);
    inject(DestroyRef).onDestroy(() => tabsState.clear());
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe(() => this.mainElement().nativeElement.focus());

    effect(() => {
      if (this.user()) untracked(() => this.navBadges.refresh());
    });

    effect(() => {
      if (!this.viewport.usesDrawer()) this.drawerOpen.set(false);
    });
  }

  protected openDrawer(): void {
    this.drawerOpen.set(true);
  }

  protected dismissSidebar(): void {
    if (this.viewport.usesDrawer()) this.closeDrawer();
  }

  protected closeDrawer(): void {
    if (!this.drawerOpen()) return;
    this.drawerOpen.set(false);
    this.menuButton()?.nativeElement.focus();
  }

  protected logout(): void {
    this.loggingOut.set(true);
    this.logoutError.clear();
    this.auth.logout().subscribe({
      next: () => void this.router.navigate(['/login']),
      error: (error: unknown) => {
        this.loggingOut.set(false);
        this.logoutError.setFrom(error);
      },
    });
  }

  private routeFlag(key: string): boolean {
    let current: ActivatedRouteSnapshot | null = this.route.snapshot;
    while (current) {
      if (current.data[key] === true) return true;
      current = current.firstChild;
    }
    return false;
  }
}
