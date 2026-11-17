import type { APIRequestContext } from '@playwright/test';
import { pngImage } from './images';
import { PASSWORD } from './real-api';

export const dateIn = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

export const uniqueSpotNumber = (prefix: string) =>
  `${prefix}-${Date.now().toString(36).slice(-5)}${Math.floor(Math.random() * 100)}`.toUpperCase();

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export class Api {
  private readonly request: APIRequestContext;

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  async send<T = unknown>(method: Method, path: string, data?: unknown): Promise<T> {
    const { cookies } = await this.request.storageState();
    const token = cookies.find((cookie) => cookie.name === 'XSRF-TOKEN')?.value ?? '';
    const response = await this.request.fetch(path, {
      method,
      data,
      headers: { 'x-xsrf-token': decodeURIComponent(token) },
    });
    const text = await response.text();
    if (!response.ok()) throw new Error(`${method} ${path} -> ${response.status()}: ${text}`);
    return text ? JSON.parse(text) : (undefined as T);
  }

  async uploadImage(path: string, shade: number): Promise<number> {
    const { cookies } = await this.request.storageState();
    const token = cookies.find((cookie) => cookie.name === 'XSRF-TOKEN')?.value ?? '';
    const response = await this.request.post(path, {
      multipart: { file: pngImage(`api-${shade}.png`, shade) },
      headers: { 'x-xsrf-token': decodeURIComponent(token) },
    });
    return response.status();
  }

  storageState(path?: string) {
    return this.request.storageState({ path });
  }

  async login(email: string): Promise<this> {
    await this.send('GET', '/api/v1/auth/csrf');
    await this.send('POST', '/api/v1/auth/login', { email, password: PASSWORD });
    await this.send('GET', '/api/v1/auth/csrf');
    return this;
  }

  createSpot(
    condominiumId: string,
    number: string,
    size = 'MEDIUM',
    ownerResidentId?: string,
    covered = false,
  ): Promise<{ id: string }> {
    return this.send('POST', '/api/v1/parking-spots', {
      condominiumId,
      number,
      location: 'E2E',
      size,
      covered,
      ...(ownerResidentId ? { ownerResidentId } : {}),
    });
  }

  addAvailability(parkingSpotId: string, dailyPrice: number, start = 1, end = 90) {
    return this.send('POST', '/api/v1/spot-availabilities', {
      parkingSpotId,
      dailyPrice,
      startDate: dateIn(start),
      endDate: dateIn(end),
    });
  }

  requestRental(
    parkingSpotId: string,
    renterResidentId: string,
    vehicleId: string,
    start: number,
    end: number,
  ): Promise<{ id: string }> {
    return this.send('POST', '/api/v1/rentals', {
      parkingSpotId,
      renterResidentId,
      vehicleId,
      startDate: dateIn(start),
      endDate: dateIn(end),
    });
  }

  setRentalStatus(id: string, status: string, reason?: string) {
    return this.send('PATCH', `/api/v1/rentals/${id}`, {
      status,
      ...(reason ? { cancelReason: reason } : {}),
    });
  }

  setSpotStatus(id: string, status: string, statusReason?: string) {
    return this.send('PATCH', `/api/v1/parking-spots/${id}`, { status, statusReason });
  }
}
