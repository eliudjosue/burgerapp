import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

export interface Toast {
  id: string;
  orderId: string;
  orderNumber: string;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly router = inject(Router);
  readonly toasts = signal<Toast[]>([]);

  add(orderId: string, orderNumber: string, total: number): void {
    const id = `t-${orderId}`;
    if (this.toasts().some(t => t.id === id)) return;
    this.toasts.update(ts => [{ id, orderId, orderNumber, total }, ...ts]);
  }

  dismiss(id: string): void {
    this.toasts.update(ts => ts.filter(t => t.id !== id));
  }

  viewOrder(toastId: string): void {
    this.dismiss(toastId);
    void this.router.navigate(['/staff/cashier']);
  }
}
