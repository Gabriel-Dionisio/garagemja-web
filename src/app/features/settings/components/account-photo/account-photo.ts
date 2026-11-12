import { Dialog } from '@angular/cdk/dialog';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Role } from '../../../../core/auth/auth.model';
import { ROLE_LABELS } from '../../../../core/auth/role';
import { formatCpf } from '../../../../shared/forms/masks';
import { Avatar } from '../../../../shared/ui/avatar/avatar';
import { Icon } from '../../../../shared/ui/icon/icon';
import { Profile } from '../../profile.model';
import { PhotoViewer } from '../photo-viewer/photo-viewer';

const MAX_BYTES = 5 * 1024 * 1024;

@Component({
  selector: 'app-account-photo',
  imports: [TranslocoPipe, Avatar, Icon],
  templateUrl: './account-photo.html',
  styleUrl: './account-photo.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountPhoto {
  readonly profile = input.required<Profile>();
  readonly roles = input.required<readonly Role[]>();
  readonly busy = input(false);

  readonly selected = output<File>();
  readonly removed = output<void>();

  private readonly dialog = inject(Dialog);
  protected readonly rejected = signal<'type' | 'size' | null>(null);
  protected readonly roleLabels = ROLE_LABELS;
  protected readonly cpf = computed(() => formatCpf(this.profile().cpf));

  protected pick(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    this.rejected.set(null);
    if (!file) return;
    if (!file.type.startsWith('image/')) this.rejected.set('type');
    else if (file.size > MAX_BYTES) this.rejected.set('size');
    else this.selected.emit(file);
  }

  protected view(): void {
    const src = this.profile().photoUrl;
    if (src)
      this.dialog.open(PhotoViewer, {
        data: { src, name: this.profile().name },
        autoFocus: 'dialog',
      });
  }
}
