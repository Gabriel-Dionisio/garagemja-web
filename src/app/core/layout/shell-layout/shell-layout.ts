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
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { Alert } from '../../../shared/ui/alert/alert';
import { BrandLogo } from '../../../shared/ui/brand-logo/brand-logo';
import { LanguageSwitcher } from '../../../shared/ui/language-switcher/language-switcher';
import { Icon } from '../../../shared/ui/icon/icon';
import { AuthService } from '../../auth/auth-service';
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
    BrandLogo,
    Icon,
    LanguageSwitcher,
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
  private readonly mainElement = viewChild.required<ElementRef<HTMLElement>>('main');
  private readonly menuButton = viewChild<ElementRef<HTMLButtonElement>>('menuButton');

  protected readonly viewport = inject(ViewportService);
  protected readonly user = this.auth.user;
  protected readonly items = computed(() => navItemsFor(this.user()?.roles ?? []));
  protected readonly drawerOpen = signal(false);
  protected readonly logoutError = this.errorText.state();
  protected readonly loggingOut = signal(false);
  protected readonly showSidebar = computed(() => !this.viewport.usesDrawer() || this.drawerOpen());

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe(() => this.mainElement().nativeElement.focus());

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
}
