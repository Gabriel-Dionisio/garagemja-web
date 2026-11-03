import { TestBed } from '@angular/core/testing';
import { Avatar } from './avatar';

describe('Avatar', () => {
  it('mostra as iniciais dos dois primeiros nomes', async () => {
    const fixture = TestBed.createComponent(Avatar);
    fixture.componentRef.setInput('name', 'ana maria souza');
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent.trim()).toBe('AM');
  });
});
