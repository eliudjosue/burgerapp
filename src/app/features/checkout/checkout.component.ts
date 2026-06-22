import { Component, signal, inject, computed } from '@angular/core';
import { CartService } from '../../core/services/cart.service';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';

interface DeliveryZone {
  id: string;
  name: string;
  cost: number;
}

const mockZones: DeliveryZone[] = [
  { id: 'centro', name: 'Centro', cost: 500 },
  { id: 'norte', name: 'Barrio Norte', cost: 800 },
  { id: 'sur', name: 'Barrio Sur', cost: 800 },
  { id: 'oeste', name: 'Barrio Oeste', cost: 1000 },
];

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [FormsModule, RouterLink, CurrencyPipe],
  template: `
    <div class="max-w-6xl mx-auto px-4 py-8">
      @if (this.cartService.isEmpty()) {
        <div class="bg-surface border border-border rounded-md p-8 text-center">
          <h2 class="h2 mb-4">Tu carrito está vacío</h2>
          <p class="text-muted mb-6">No tienes productos en tu carrito.</p>
          <a routerLink="/catalog" class="inline-block px-6 py-3 bg-accent text-accent-on rounded-md font-medium hover:bg-accent/90 transition-colors">
            Ver Catálogo
          </a>
        </div>
      } @else {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Formulario principal -->
          <div class="lg:col-span-2">
            <form (ngSubmit)="onSubmit()" #checkoutForm="ngForm" class="space-y-8">
              <!-- Datos del cliente -->
              <div class="bg-surface border border-border rounded-md p-6">
                <h2 class="h2 mb-4">Datos del cliente</h2>
                <div class="space-y-4">
                  <div>
                    <label for="customerName" class="text-small font-medium text-muted block mb-1">Nombre *</label>
                    <input
                      type="text"
                      id="customerName"
                      name="customerName"
                      [(ngModel)]="formData.customerName"
                      required
                      class="border border-border rounded-sm p-3 w-full focus:ring-2 focus:ring-accent-soft focus:border-accent"
                    >
                  </div>
                  <div>
                    <label for="phone" class="text-small font-medium text-muted block mb-1">Teléfono *</label>
                    <input
                      type="text"
                      id="phone"
                      name="phone"
                      [(ngModel)]="formData.phone"
                      required
                      class="border border-border rounded-sm p-3 w-full focus:ring-2 focus:ring-accent-soft focus:border-accent"
                    >
                  </div>
                </div>
              </div>

              <!-- Tipo de entrega -->
              <div class="bg-surface border border-border rounded-md p-6">
                <h2 class="h2 mb-4">Tipo de entrega</h2>
                <div class="space-y-4">
                  <label class="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryType"
                      value="pickup"
                      [(ngModel)]="formData.deliveryType"
                      (ngModelChange)="onDeliveryTypeChange($event)"
                      class="mr-2 text-accent"
                    >
                    <span class="font-medium">Retiro en local</span>
                  </label>
                  <label class="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryType"
                      value="delivery"
                      [(ngModel)]="formData.deliveryType"
                      (ngModelChange)="onDeliveryTypeChange($event)"
                      class="mr-2 text-accent"
                    >
                    <span class="font-medium">Delivery</span>
                  </label>
                </div>
              </div>

              <!-- Campos de entrega -->
              @if (formData.deliveryType === 'delivery') {
                <div class="bg-surface border border-border rounded-md p-6">
                  <h2 class="h2 mb-4">Datos de entrega</h2>
                  <div class="space-y-4">
                    <div>
                      <label for="address" class="text-small font-medium text-muted block mb-1">Dirección *</label>
                      <input
                        type="text"
                        id="address"
                        name="address"
                        [(ngModel)]="formData.address"
                        required
                        class="border border-border rounded-sm p-3 w-full focus:ring-2 focus:ring-accent-soft focus:border-accent"
                      >
                    </div>
                    <div>
                      <label for="deliveryZone" class="text-small font-medium text-muted block mb-1">Zona de delivery *</label>
                      <select
                        id="deliveryZone"
                        name="deliveryZone"
                        [(ngModel)]="formData.deliveryZone"
                        (ngModelChange)="onDeliveryZoneChange($event)"
                        required
                        class="border border-border rounded-sm p-3 w-full focus:ring-2 focus:ring-accent-soft focus:border-accent"
                      >
                        <option value="">Seleccionar zona</option>
                        @for (zone of zones; track zone.id) {
                          <option [value]="zone.id">
                            {{ zone.name }} — {{ zone.cost | currency:'ARS':'symbol-narrow':'1.0-0' }}
                          </option>
                        }
                      </select>
                    </div>
                  </div>
                </div>
              }

              <!-- Comentarios adicionales -->
              <div class="bg-surface border border-border rounded-md p-6">
                <h2 class="h2 mb-4">Comentarios adicionales</h2>
                <div class="space-y-4">
                  <textarea
                    name="comments"
                    [(ngModel)]="formData.comments"
                    rows="4"
                    placeholder="Sin cebolla, instrucciones especiales..."
                    class="border border-border rounded-sm p-3 w-full focus:ring-2 focus:ring-accent-soft focus:border-accent"
                  ></textarea>
                </div>
              </div>

              <!-- Método de pago -->
              <div class="bg-surface border border-border rounded-md p-6">
                <h2 class="h2 mb-4">Método de pago</h2>
                <div class="space-y-4">
                  <label class="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      [(ngModel)]="formData.paymentMethod"
                      class="mr-2 text-accent"
                    >
                    <span class="font-medium">Efectivo (al entregar/retirar)</span>
                  </label>
                  <label class="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="transfer"
                      [(ngModel)]="formData.paymentMethod"
                      class="mr-2 text-accent"
                    >
                    <span class="font-medium">Transferencia bancaria</span>
                  </label>
                  <label class="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="mp"
                      [(ngModel)]="formData.paymentMethod"
                      class="mr-2 text-accent"
                    >
                    <span class="font-medium">Mercado Pago</span>
                  </label>
                </div>

                <!-- Datos de transferencia -->
                @if (formData.paymentMethod === 'transfer') {
                  <div class="mt-4 p-4 bg-accent-soft/30 rounded-md">
                    <h3 class="h3 mb-2">Datos de transferencia</h3>
                    <p class="mb-1"><span class="font-medium">Alias:</span> BURGERAPP</p>
                    <p><span class="font-medium">CBU:</span> 0000000000000000000000</p>
                  </div>
                }
              </div>

              <!-- Botón de confirmar -->
              <button
                type="submit"
                class="w-full px-6 py-3 bg-accent text-accent-on rounded-md font-medium hover:bg-accent/90 transition-colors"
              >
                Confirmar Pedido
              </button>
            </form>
          </div>

          <!-- Resumen del pedido -->
          <div class="lg:col-span-1">
            <div class="bg-surface border border-border rounded-md p-6 sticky top-8">
              <h2 class="h2 mb-4">Resumen del pedido</h2>
              
              <div class="space-y-3 mb-6">
                @for (item of cartService.items(); track item.product.id) {
                  <div class="flex justify-between items-center">
                    <span class="font-medium">{{ item.product.name }} x{{ item.quantity }}</span>
                    <span class="font-medium">{{ item.product.price * item.quantity | currency:'ARS':'symbol-narrow':'1.0-0' }}</span>
                  </div>
                }
              </div>

              <div class="border-t border-border pt-4 space-y-2 mb-4">
                <div class="flex justify-between">
                  <span class="text-muted">Subtotal</span>
                  <span>{{ cartService.total() | currency:'ARS':'symbol-narrow':'1.0-0' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted">Costo de envío</span>
                  <span>{{ shippingCost() | currency:'ARS':'symbol-narrow':'1.0-0' }}</span>
                </div>
                <div class="flex justify-between font-semibold text-lg mt-2 pt-2 border-t border-border">
                  <span>Total</span>
                  <span>{{ total() | currency:'ARS':'symbol-narrow':'1.0-0' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
  `
})
export class CheckoutComponent {
  readonly cartService = inject(CartService);
  private readonly router = inject(Router);

  zones = mockZones;

  formData = {
    customerName: '',
    phone: '',
    deliveryType: 'pickup',
    address: '',
    deliveryZone: '',
    comments: '',
    paymentMethod: 'cash'
  };

  shippingCost = signal(0);
  total = computed(() => this.cartService.total() + this.shippingCost());

  constructor() {
    // Establecer costo de envío por defecto para retiro en local
    this.shippingCost.set(0);
  }

  onSubmit() {
    // Valida campos requeridos en el frontend
    if (!this.formData.customerName || !this.formData.phone) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    if (this.formData.deliveryType === 'delivery' && 
        (!this.formData.address || !this.formData.deliveryZone)) {
      alert('Por favor completa todos los campos de entrega');
      return;
    }

    // Generar ID de pedido mock
    const orderId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Limpiar carrito
    this.cartService.clearCart();
    
    // Redirigir a confirmación
    this.router.navigate(['/order-confirmation'], { queryParams: { orderId } });
  }

  onDeliveryTypeChange(value: string): void {
    this.formData.deliveryType = value;
    if (value === 'pickup') {
      this.shippingCost.set(0);
    } else {
      this.updateShippingCost();
    }
  }

  onDeliveryZoneChange(value: string): void {
    this.formData.deliveryZone = value;
    this.updateShippingCost();
  }

  private updateShippingCost(): void {
    if (this.formData.deliveryType !== 'delivery' || !this.formData.deliveryZone) {
      this.shippingCost.set(0);
      return;
    }

    const zone = this.zones.find((item) => item.id === this.formData.deliveryZone);
    this.shippingCost.set(zone?.cost ?? 0);
  }
}