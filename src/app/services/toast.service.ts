import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ToastMessage {
  text: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toastSubject = new Subject<ToastMessage>();
  toastState = this.toastSubject.asObservable();

  showSuccess(message: string) {
    this.toastSubject.next({ text: message, type: 'success' });
  }

  showError(message: string) {
    this.toastSubject.next({ text: message, type: 'error' });
  }

  showInfo(message: string) {
    this.toastSubject.next({ text: message, type: 'info' });
  }
}
