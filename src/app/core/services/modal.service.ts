import { Injectable, signal } from '@angular/core';

export type ModalType = 'success' | 'error' | 'warning' | 'info';

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  readonly isOpen = signal(false);
  readonly type = signal<ModalType>('info');
  readonly title = signal('');
  readonly message = signal('');

  show(type: ModalType, title: string, message: string): void {
    this.type.set(type);
    this.title.set(title);
    this.message.set(message);
    this.isOpen.set(true);
  }

  showError(title: string, message: string): void {
    this.show('error', title, message);
  }

  showSuccess(title: string, message: string): void {
    this.show('success', title, message);
  }

  showWarning(title: string, message: string): void {
    this.show('warning', title, message);
  }

  close(): void {
    this.isOpen.set(false);
  }
}
