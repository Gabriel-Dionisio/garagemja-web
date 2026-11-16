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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { Alert } from '../../../shared/ui/alert/alert';
import { Badge } from '../../../shared/ui/badge/badge';
import { BrandLogo } from '../../../shared/ui/brand-logo/brand-logo';
import { CondominiumTabsState } from '../../../shared/ui/condominium-tabs/condominium-tabs-state';
import { Icon } from '../../../shared/ui/icon/icon';
import { IconButton } from '../../../shared/ui/icon-button/icon-button';
import { AuthService } from '../../auth/auth-service';
import { NotificationBell } from '../../notifications/notification-bell/notification-bell';
import { NavBadges } from '../nav-badges';
import { NAV_GROUP_LABEL_KEY, NAV_GROUP_ORDER, bottomNavFor, navItemsFor } from '../nav-items';
import { BottomNav } from '../bottom-nav/bottom-nav';
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
    BottomNav,
    BrandLogo,
    Icon,
    UserMenu,
    NotificationBell,
    IconButton,
  ],
  templateUrl: './shell-layout.html',
  styleUrl: './shell-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellLayout {
  private readonly auth = inject(AuthService);
  private readonly errorText = inject(ErrorText);
  private readonly router = inject(Router);
  private readonly mainElement = viewChild.required<ElementRef<HTMLElement>>('main');
  private readonly menuButton = viewChild<string, ElementRef<HTMLButtonElement>>('menuButton', {
    read: ElementRef,
  });

  private readonly navBadges = inject(NavBadges);

  protected readonly viewport = inject(ViewportService);
  protected readonly badgeCount = this.navBadges.condominiums;
  protected readonly user = this.auth.user;

  protected readonly homeLink = computed(() =>
    this.auth.hasRole('ADMIN') ? '/dashboard' : '/home',
  );
  protected readonly items = computed(() => navItemsFor(this.user()?.roles ?? []));
  protected readonly bottomItems = computed(() => bottomNavFor(this.user()?.roles ?? []));
  protected readonly sections = computed(() =>
    NAV_GROUP_ORDER.map((group) => ({
      group,
      titleKey: group ? NAV_GROUP_LABEL_KEY[group] : null,
      items: this.items().filter((item) => item.group === group),
    })).filter((section) => section.items.length > 0),
  );
  protected readonly navOpen = signal(false);
  protected readonly logoutError = this.errorText.state();
  protected readonly loggingOut = signal(false);
  protected readonly showSidebar = computed(() => !this.viewport.usesDrawer() || this.navOpen());

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
      this.viewport.usesDrawer();
      untracked(() => this.navOpen.set(false));
    });
  }

  protected openNav(): void {
    this.navOpen.set(true);
  }

  protected closeNav(): void {
    if (!this.navOpen()) return;
    this.navOpen.set(false);
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
}
