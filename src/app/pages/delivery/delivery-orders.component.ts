import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../partials/header/header.component';
import { DeliveryOrderService } from './delivery-order.service';
import { AuthService } from '../../auth/auth.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ToastService } from '../../services/toast.service';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

declare var Razorpay: any;

@Component({
  selector: 'app-delivery-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, CurrencyPipe, DatePipe],
  templateUrl: './delivery-orders.component.html',
  styleUrls: ['./delivery-orders.component.css'],
})
export class DeliveryOrdersComponent implements OnInit, OnDestroy {
  scope: 'active' | 'history' = 'active';
  orders: any[] = [];
  loading = true;
  errorMessage = '';
  showDetailsPopup = false;
  selectedOrder: any = null;
  sendingOtp = false;
  completing = false;
  openingDirections = false;
  trackingActive = false;
  trackingWatchId: number | null = null;
  trackingStatusMessage = '';
  lastTrackedLocation: any = null;
  lastLocationSyncAt: string | null = null;
  lastLocationSentAt = 0;
  actionMessage = '';
  currentOrg: any = null;
  private routeSubscription: Subscription | null = null;
  private hasFetchedOrders = false;
  private pendingDeepLinkedOrderId = '';
  private missingDeepLinkedOrderId = '';

  completion = this.createCompletionState();

  constructor(
    private deliveryOrderService: DeliveryOrderService,
    private auth: AuthService,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    private toast: ToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.currentOrg = this.auth.currentUserValue?.org;
    this.routeSubscription = this.route.queryParamMap.subscribe((params) => {
      const requestedScope = params.get('scope') === 'history' ? 'history' : 'active';
      const requestedOrderId = params.get('orderId')?.trim() || '';
      const scopeChanged = this.scope !== requestedScope;
      const orderChanged = this.pendingDeepLinkedOrderId !== requestedOrderId;

      this.scope = requestedScope;
      this.pendingDeepLinkedOrderId = requestedOrderId;

      if (orderChanged) {
        this.missingDeepLinkedOrderId = '';
      }

      if (scopeChanged && this.showDetailsPopup) {
        this.closeDetails();
      }

      if (scopeChanged || !this.hasFetchedOrders) {
        this.fetchOrders();
        return;
      }

      this.openDeepLinkedOrderIfRequested();
    });
  }

  ngOnDestroy() {
    this.stopTracking(false);
    this.routeSubscription?.unsubscribe();
  }

  private createCompletionState() {
    return {
      otp: '',
      settlementMode: 'none',
      amount: null as number | null,
      razorpay_order_id: '',
      razorpay_payment_id: '',
      razorpay_signature: '',
    };
  }

  fetchOrders() {
    this.loading = true;
    this.deliveryOrderService.getMyOrders(this.scope).subscribe({
      next: (res: any) => {
        this.orders = res.orders || [];
        this.loading = false;
        this.hasFetchedOrders = true;
        this.errorMessage = '';
        this.openDeepLinkedOrderIfRequested();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Failed to load assigned orders.';
        this.cdr.detectChanges();
      },
    });
  }

  switchScope(scope: 'active' | 'history') {
    if (this.scope === scope) return;
    this.scope = scope;
    this.pendingDeepLinkedOrderId = '';
    this.missingDeepLinkedOrderId = '';
    this.closeDetails();
    this.fetchOrders();
  }

  private openDeepLinkedOrderIfRequested() {
    if (!this.pendingDeepLinkedOrderId || this.loading) {
      return;
    }

    if (
      this.showDetailsPopup &&
      String(this.selectedOrder?._id || '') === this.pendingDeepLinkedOrderId
    ) {
      return;
    }

    const matchingOrder = this.orders.find(
      (order) => String(order?._id || '') === this.pendingDeepLinkedOrderId
    );

    if (matchingOrder) {
      this.openDetails(matchingOrder);
      return;
    }

    if (this.missingDeepLinkedOrderId !== this.pendingDeepLinkedOrderId) {
      this.missingDeepLinkedOrderId = this.pendingDeepLinkedOrderId;
      this.toast.showError('Requested delivery order was not found.');
    }
  }

  openDetails(order: any) {
    this.selectedOrder = order;
    this.showDetailsPopup = true;
    this.actionMessage = '';
    this.resetCompletion(order);
    this.lastTrackedLocation = order?.delivery?.agentLiveLocation || null;
    this.lastLocationSyncAt = order?.delivery?.agentLiveLocation?.recordedAt || null;
    this.trackingStatusMessage = this.lastLocationSyncAt
      ? 'Live tracking last synced recently.'
      : '';
  }

  closeDetails() {
    this.stopTracking(false);
    this.showDetailsPopup = false;
    this.selectedOrder = null;
    this.actionMessage = '';
    this.completion = this.createCompletionState();
    this.lastTrackedLocation = null;
    this.lastLocationSyncAt = null;
    this.trackingStatusMessage = '';
  }

  resetCompletion(order: any) {
    const remaining = this.getRemainingBalance(order);
    this.completion = {
      otp: '',
      settlementMode: remaining > 0 && this.isCodOrder(order) ? 'cash' : 'none',
      amount: remaining > 0 ? remaining : null,
      razorpay_order_id: '',
      razorpay_payment_id: '',
      razorpay_signature: '',
    };
  }

  getItemCount(order: any) {
    return order?.items?.reduce((count: number, item: any) => count + Number(item.quantity || 0), 0) || 0;
  }

  formatStatus(status: string) {
    if (!status) return 'Unknown';
    return status
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  formatPaymentMethod(paymentMethod: string) {
    if (!paymentMethod) return 'Unknown';
    return paymentMethod.toLowerCase() === 'cod'
      ? 'COD'
      : paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1).toLowerCase();
  }

  isCodOrder(order: any) {
    return String(order?.paymentMethod || '').toLowerCase() === 'cod';
  }

  getRemainingBalance(order: any) {
    return Number(order?.saleId?.balance_amount ?? order?.total ?? 0);
  }

  hasDeliveryLocation(order: any) {
    return (
      order?.deliveryLocation?.latitude !== null &&
      order?.deliveryLocation?.latitude !== undefined &&
      order?.deliveryLocation?.longitude !== null &&
      order?.deliveryLocation?.longitude !== undefined
    );
  }

  getDeliveryLocationLabel(order: any) {
    return order?.deliveryLocation?.address || order?.deliveryLocation?.label || order?.deliveryAddress || 'Location not shared';
  }

  getDeliveryLocationEmbedUrl(order: any): SafeResourceUrl | null {
    if (!this.hasDeliveryLocation(order)) {
      return null;
    }

    const { latitude, longitude } = order.deliveryLocation;
    const mapUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`;

    return this.sanitizer.bypassSecurityTrustResourceUrl(mapUrl);
  }

  hasAgentLiveLocation(order: any) {
    return (
      order?.delivery?.agentLiveLocation?.latitude !== null &&
      order?.delivery?.agentLiveLocation?.latitude !== undefined &&
      order?.delivery?.agentLiveLocation?.longitude !== null &&
      order?.delivery?.agentLiveLocation?.longitude !== undefined
    );
  }

  getAgentLiveLocationLabel(order: any) {
    const location = order?.delivery?.agentLiveLocation;
    if (!location?.recordedAt) {
      return 'Not shared yet';
    }

    const accuracy = location?.accuracy ? ` ±${Math.round(location.accuracy)}m` : '';
    return `${location.latitude}, ${location.longitude}${accuracy}`;
  }

  getAgentLiveLocationMapUrl(order: any) {
    const location = order?.delivery?.agentLiveLocation;
    if (!this.hasAgentLiveLocation(order)) return '';

    return `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
  }

  openDirections(order: any) {
    if (this.openingDirections) return;

    const destination = this.hasDeliveryLocation(order)
      ? `${order.deliveryLocation.latitude},${order.deliveryLocation.longitude}`
      : encodeURIComponent(order?.deliveryAddress || order?.deliveryLocation?.address || '');

    if (!destination) {
      this.toast.showError('Customer location is not available for directions.');
      return;
    }

    this.openingDirections = true;

    if (order?.status === 'in-delivery' && !this.trackingActive) {
      this.startTracking();
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const origin = `${coords.latitude},${coords.longitude}`;
        window.open(
          `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`,
          '_blank',
          'noopener'
        );
        this.openingDirections = false;
      },
      () => {
        window.open(
          `https://www.google.com/maps/search/?api=1&query=${destination}`,
          '_blank',
          'noopener'
        );
        this.openingDirections = false;
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  private calculateDistanceMeters(
    first: { latitude: number; longitude: number },
    second: { latitude: number; longitude: number }
  ) {
    const toRadians = (value: number) => (value * Math.PI) / 180;
    const earthRadius = 6371000;
    const deltaLat = toRadians(second.latitude - first.latitude);
    const deltaLng = toRadians(second.longitude - first.longitude);
    const lat1 = toRadians(first.latitude);
    const lat2 = toRadians(second.latitude);

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadius * c;
  }

  private maybeSendTrackingUpdate(position: GeolocationPosition) {
    if (!this.selectedOrder?._id) {
      return;
    }

    const nextLocation = {
      latitude: Number(position.coords.latitude.toFixed(6)),
      longitude: Number(position.coords.longitude.toFixed(6)),
      accuracy: position.coords.accuracy ? Number(position.coords.accuracy.toFixed(1)) : null,
    };

    const previous = this.lastTrackedLocation;
    const now = Date.now();
    const movedEnough =
      !previous ||
      this.calculateDistanceMeters(previous, nextLocation) >= 30;
    const timeElapsedEnough = now - this.lastLocationSentAt >= 15000;

    if (!movedEnough && !timeElapsedEnough) {
      return;
    }

    this.deliveryOrderService.updateLocation(this.selectedOrder._id, nextLocation).subscribe({
      next: (res: any) => {
        this.lastTrackedLocation = res.agentLiveLocation || {
          ...nextLocation,
          recordedAt: new Date().toISOString(),
        };
        this.lastLocationSentAt = now;
        this.lastLocationSyncAt = this.lastTrackedLocation?.recordedAt || new Date().toISOString();
        this.trackingStatusMessage = 'Live tracking is active.';

        if (this.selectedOrder) {
          this.selectedOrder = {
            ...this.selectedOrder,
            delivery: {
              ...(this.selectedOrder.delivery || {}),
              agentLiveLocation: this.lastTrackedLocation,
            },
          };
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        this.trackingStatusMessage = err.error?.message || 'Unable to sync live location.';
        this.toast.showError(this.trackingStatusMessage);
        this.cdr.detectChanges();
      },
    });
  }

  startTracking() {
    if (!this.selectedOrder?._id) {
      this.toast.showError('Open an assigned order before starting tracking.');
      return;
    }

    if (this.selectedOrder?.status !== 'in-delivery') {
      this.toast.showError('Live tracking is only available for active deliveries.');
      return;
    }

    if (!navigator.geolocation) {
      this.toast.showError('Live tracking is not supported in this browser.');
      return;
    }

    if (this.trackingWatchId !== null) {
      this.trackingActive = true;
      this.trackingStatusMessage = 'Live tracking is already running.';
      return;
    }

    this.trackingStatusMessage = 'Starting live tracking...';
    this.trackingWatchId = navigator.geolocation.watchPosition(
      (position) => {
        this.trackingActive = true;
        this.maybeSendTrackingUpdate(position);
      },
      (error) => {
        this.trackingActive = false;
        this.trackingStatusMessage =
          error.code === error.PERMISSION_DENIED
            ? 'Location permission was denied.'
            : 'Unable to read current location.';
        this.toast.showError(this.trackingStatusMessage);
        this.stopTracking(false);
        this.cdr.detectChanges();
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      }
    );
  }

  stopTracking(showToast = true) {
    if (this.trackingWatchId !== null) {
      navigator.geolocation.clearWatch(this.trackingWatchId);
      this.trackingWatchId = null;
    }

    const wasActive = this.trackingActive;
    this.trackingActive = false;

    if (showToast && wasActive) {
      this.toast.showInfo('Live tracking stopped.');
    }

    if (showToast) {
      this.trackingStatusMessage = 'Live tracking stopped.';
    }
  }

  sendOtp() {
    if (!this.selectedOrder?._id) return;

    this.sendingOtp = true;
    this.deliveryOrderService.sendOtp(this.selectedOrder._id).subscribe({
      next: (res: any) => {
        this.sendingOtp = false;
        this.actionMessage = res.message || 'OTP sent successfully.';
        this.toast.showSuccess(this.actionMessage);
        this.selectedOrder = {
          ...this.selectedOrder,
          delivery: {
            ...(this.selectedOrder.delivery || {}),
            otpSentAt: res.otpSentAt,
            otpExpiresAt: res.otpExpiresAt,
          },
        };
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.sendingOtp = false;
        this.actionMessage = err.error?.message || 'Failed to send OTP.';
        this.toast.showError(this.actionMessage);
        this.cdr.detectChanges();
      },
    });
  }

  startRazorpayCollection() {
    if (!this.selectedOrder?._id) return;

    this.deliveryOrderService.createCodRazorpayOrder(this.selectedOrder._id).subscribe({
      next: (res: any) => {
        const razorpay = res.razorpay;
        const options = {
          key: razorpay.key,
          amount: Math.round(Number(razorpay.amount || 0) * 100),
          currency: razorpay.currency || 'INR',
          name: razorpay.organisationName || this.currentOrg?.name || 'Your Business Name',
          description: 'COD Delivery Settlement',
          order_id: razorpay.orderId,
          handler: (response: any) => {
            this.completion.settlementMode = 'razorpay';
            this.completion.amount = Number(razorpay.amount || 0);
            this.completion.razorpay_order_id = response.razorpay_order_id;
            this.completion.razorpay_payment_id = response.razorpay_payment_id;
            this.completion.razorpay_signature = response.razorpay_signature;
            this.toast.showSuccess('Razorpay payment captured. You can now mark the order delivered.');
            this.cdr.detectChanges();
          },
          prefill: {
            contact: this.selectedOrder?.customerNumber || '',
          },
          method: {
            upi: true,
            card: false,
            netbanking: false,
            wallet: false,
          },
        };

        const rzp = new Razorpay(options);
        rzp.open();
      },
      error: (err) => {
        this.toast.showError(err.error?.message || 'Failed to start Razorpay collection.');
      },
    });
  }

  completeOrder() {
    if (!this.selectedOrder?._id) return;

    if (!this.completion.otp) {
      this.toast.showError('Enter the OTP shared by the customer.');
      return;
    }

    const remaining = this.getRemainingBalance(this.selectedOrder);
    const payload: any = {
      otp: this.completion.otp,
      settlementMode: 'none',
    };

    if (this.isCodOrder(this.selectedOrder) && remaining > 0) {
      payload.settlementMode = this.completion.settlementMode;
      payload.amount = remaining;

      if (this.completion.settlementMode === 'razorpay') {
        if (
          !this.completion.razorpay_order_id ||
          !this.completion.razorpay_payment_id ||
          !this.completion.razorpay_signature
        ) {
          this.toast.showError('Complete the Razorpay payment before marking delivery done.');
          return;
        }

        payload.razorpay_order_id = this.completion.razorpay_order_id;
        payload.razorpay_payment_id = this.completion.razorpay_payment_id;
        payload.razorpay_signature = this.completion.razorpay_signature;
      }
    }

    this.completing = true;
    this.deliveryOrderService.completeOrder(this.selectedOrder._id, payload).subscribe({
      next: () => {
        this.completing = false;
        this.stopTracking(false);
        this.toast.showSuccess('Order marked as delivered.');
        this.closeDetails();
        this.fetchOrders();
      },
      error: (err) => {
        this.completing = false;
        this.actionMessage = err.error?.message || 'Failed to complete delivery.';
        this.toast.showError(this.actionMessage);
        this.cdr.detectChanges();
      },
    });
  }
}
