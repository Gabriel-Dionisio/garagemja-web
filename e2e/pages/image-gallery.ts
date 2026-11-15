import type { Locator, Page } from '@playwright/test';
import { pngImage } from '../support/images';

export class ImageGallery {
  readonly counter: Locator;
  readonly picture: Locator;
  readonly cover: Locator;
  private readonly file: Locator;

  constructor(private readonly page: Page) {
    this.file = page.getByLabel('Escolher imagem');
    this.counter = page.locator('app-image-field .count');
    this.picture = page.locator('app-image-field img');
    this.cover = page.getByText('Capa', { exact: true });
  }

  async upload(...shades: number[]): Promise<void> {
    await this.file.setInputFiles(shades.map((shade) => pngImage(`foto-${shade}.png`, shade)));
  }

  async next(): Promise<void> {
    await this.page.getByRole('button', { name: 'Próxima imagem' }).click();
  }

  async previous(): Promise<void> {
    await this.page.getByRole('button', { name: 'Imagem anterior' }).click();
  }

  async removeCurrent(): Promise<void> {
    await this.page.getByRole('button', { name: 'Remover imagem' }).click();
  }

  async moveBack(): Promise<void> {
    await this.page.getByRole('button', { name: 'Mover para trás' }).click();
  }
}
