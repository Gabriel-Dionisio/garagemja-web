import type { BrowserContext, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { ImageGallery } from '../pages/image-gallery';
import { LoginPage, RegisterPage } from '../pages/auth.page';
import { CondominiumDetailPage, CondominiumsPage } from '../pages/condominium.page';
import { ConfirmDialog } from '../pages/confirm-dialog';
import { MyRentalsPage } from '../pages/my-rentals.page';
import { RequestsPage } from '../pages/requests.page';
import {
  CondominiumSpotsPage,
  MyParkingSpotsPage,
  ParkingSpotFormPage,
  SpotAvailabilityPanel,
} from '../pages/parking-spots.page';
import { ShellPage } from '../pages/shell.page';
import { sessionFor } from './auth';
import type { Guard } from './guard';
import { resetWindow, type Window } from './window';
import type { Account } from './world';

export class Journey {
  readonly guard: Guard;
  readonly shell: ShellPage;
  readonly loginPage: LoginPage;
  readonly registerPage: RegisterPage;
  readonly condominiums: CondominiumsPage;
  readonly condominiumDetail: CondominiumDetailPage;
  readonly mySpots: MyParkingSpotsPage;
  readonly condominiumSpots: CondominiumSpotsPage;
  readonly spotForm: ParkingSpotFormPage;
  readonly availability: SpotAvailabilityPanel;
  readonly myRentals: MyRentalsPage;
  readonly requests: RequestsPage;
  readonly confirm: ConfirmDialog;
  readonly gallery: ImageGallery;
  private readonly context: BrowserContext;
  private readonly baseURL: string;
  readonly page: Page;

  private constructor(window: Window, baseURL: string) {
    const { context, page, guard } = window;
    this.context = context;
    this.page = page;
    this.baseURL = baseURL;
    this.guard = guard;
    this.shell = new ShellPage(page);
    this.loginPage = new LoginPage(page);
    this.registerPage = new RegisterPage(page);
    this.condominiums = new CondominiumsPage(page);
    this.condominiumDetail = new CondominiumDetailPage(page);
    this.mySpots = new MyParkingSpotsPage(page);
    this.condominiumSpots = new CondominiumSpotsPage(page);
    this.spotForm = new ParkingSpotFormPage(page);
    this.availability = new SpotAvailabilityPanel(page);
    this.myRentals = new MyRentalsPage(page);
    this.requests = new RequestsPage(page);
    this.confirm = new ConfirmDialog(page);
    this.gallery = new ImageGallery(page);
  }

  static async start(window: Window, baseURL: string): Promise<Journey> {
    await resetWindow(window);
    return new Journey(window, baseURL);
  }

  async actAs(account: Account): Promise<void> {
    await this.context.clearCookies();
    await this.context.addCookies((await sessionFor(account.email, this.baseURL)).cookies);
    await this.shell.enter();
  }

  async openCondominium(name: string, tab?: string): Promise<void> {
    await this.condominiums.open(name);
    if (tab) await this.condominiumDetail.openTab(tab);
  }

  async leave(): Promise<void> {
    await this.context.clearCookies();
  }

  async expectNoProblems(): Promise<void> {
    const problems = await this.guard.check();
    this.guard.reset();
    expect(problems, 'unexpected errors while the user used the app').toEqual([]);
  }
}
