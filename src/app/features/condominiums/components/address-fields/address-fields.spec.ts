import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { AddressFields } from './address-fields';

@Component({
  imports: [AddressFields],
  template: '<app-address-fields [controls]="controls" />',
})
class Host {
  readonly controls = {
    address: new FormControl('', { nonNullable: true }),
    number: new FormControl('', { nonNullable: true }),
    district: new FormControl('', { nonNullable: true }),
    city: new FormControl('', { nonNullable: true }),
    state: new FormControl('', { nonNullable: true }),
  };
}

describe('AddressFields', () => {
  it('renders the five address fields bound to the given controls', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const inputs = element.querySelectorAll('input');
    expect(inputs).toHaveLength(5);
    inputs[4].value = 'sp';
    inputs[4].dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.controls.state.value).toBe('SP');
  });
});
