import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { AuthService } from '../../auth/auth.service';
import { HeaderComponent } from '../../partials/header/header.component';
import { OnlineOrderService } from './online-order.service';
import { DeliveryAgentService } from '../delivery-agents/delivery-agent.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-online-order-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, CurrencyPipe, DatePipe],
  templateUrl: './online-order-list.component.html',
})
export class OnlineOrderListComponent implements OnInit, OnDestroy {
  currentOrg: any = null;
  readonly orderStatuses = [
    'pending',
    'in-delivery',
    'ready-for-pickup',
    'fulfilled',
    'cancelled',
  ];
  readonly fulfillmentPaymentStatuses = ['unpaid', 'partial', 'paid'];

  onlineOrders: any[] = [];
  filteredOrders: any[] = [];
  paginatedOrders: any[] = [];
  deliveryAgents: any[] = [];

  loading = true;
  errorMessage = '';
  searchTerm = '';
  trackingPollId: ReturnType<typeof setInterval> | null = null;
  trackingRefreshInProgress = false;

  page = 1;
  pageSize = 10;
  pageSizes = [5, 10, 25, 50];

  selectedOrder: any = null;
  selectedStatus = 'pending';
  showDetailsPopup = false;
  statusUpdateInProgress = false;
  assignmentInProgress = false;
  statusActionMessage = '';
  selectedAgentId = '';
  fulfillmentPayment: any = {
    paymentStatus: 'unpaid',
    amount: null,
    payment_method: 'cash',
    transaction_id: '',
    cheque_no: '',
  };

  constructor(
    private onlineOrderService: OnlineOrderService,
    private deliveryAgentService: DeliveryAgentService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    this.currentOrg = this.auth.currentUserValue?.org;
    this.loadDeliveryAgents();
    this.fetchOnlineOrders();
  }

  ngOnDestroy() {
    this.stopTrackingPolling();
  }

  loadDeliveryAgents() {
    this.deliveryAgentService.getAgents().subscribe({
      next: (res: any) => {
        this.deliveryAgents = (res.agents || []).filter((agent: any) => agent.isActive !== false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.deliveryAgents = [];
      },
    });
  }

  fetchOnlineOrders() {
    const orgId = this.auth.currentUserValue?.org_id;

    if (!orgId) {
      this.errorMessage = 'Organisation not found for current user.';
      this.loading = false;
      return;
    }

    this.onlineOrderService.getAllOnlineOrders(orgId).subscribe({
      next: (res: any) => {
        this.onlineOrders = res.orders || [];
        this.filteredOrders = [...this.onlineOrders];
        this.updatePaginatedOrders();
        this.errorMessage = '';
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching online orders:', err);
        this.errorMessage = err.error?.message || 'Failed to load online orders.';
        this.loading = false;
      },
    });
  }

  filterOrders() {
    const term = this.searchTerm.toLowerCase().trim();

    this.filteredOrders = this.onlineOrders.filter((order) => {
      const orderId = String(order._id || '').toLowerCase();
      const customerNumber = String(order.customerNumber || '').toLowerCase();
      const status = String(order.status || '').toLowerCase();

      return (
        orderId.includes(term) ||
        customerNumber.includes(term) ||
        status.includes(term)
      );
    });

    this.page = 1;
    this.updatePaginatedOrders();
  }

  updatePaginatedOrders() {
    const totalPages = this.totalPages();

    if (this.page > totalPages) this.page = totalPages;
    if (this.page < 1) this.page = 1;

    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + Number(this.pageSize);
    this.paginatedOrders = this.filteredOrders.slice(startIndex, endIndex);
  }

  totalPages() {
    return Math.ceil(this.filteredOrders.length / this.pageSize) || 1;
  }

  onPageSizeChange() {
    this.page = 1;
    this.updatePaginatedOrders();
  }

  openOrderDetails(order: any) {
    this.stopTrackingPolling();
    this.selectedOrder = order;
    this.selectedStatus = order?.status || 'pending';
    this.selectedAgentId = order?.delivery?.assignedAgentId?._id || order?.delivery?.assignedAgentId || '';
    this.resetFulfillmentPayment(order);
    this.statusActionMessage = '';
    this.showDetailsPopup = true;
    this.startTrackingPollingIfNeeded();
  }

  closeOrderDetails() {
    this.stopTrackingPolling();
    this.showDetailsPopup = false;
    this.selectedOrder = null;
    this.selectedStatus = 'pending';
    this.selectedAgentId = '';
    this.resetFulfillmentPayment(null);
    this.statusActionMessage = '';
    this.statusUpdateInProgress = false;
  }

  getShortOrderId(orderId: string) {
    if (!orderId) return 'N/A';
    return orderId.slice(-8).toUpperCase();
  }

  getItemCount(order: any) {
    return order?.items?.reduce((count: number, item: any) => count + Number(item.quantity || 0), 0) || 0;
  }

  formatPaymentMethod(paymentMethod: string) {
    if (!paymentMethod) return 'Unknown';

    if (paymentMethod.toLowerCase() === 'cod') return 'COD';
    if (paymentMethod.toLowerCase() === 'upi') return 'UPI';

    return paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1).toLowerCase();
  }

  formatStatus(status: string) {
    if (!status) return 'Unknown';
    return status
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  getAssignedAgentName(order: any) {
    return order?.delivery?.assignedAgentId?.name || 'Unassigned';
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
    if (!this.hasAgentLiveLocation(order)) {
      return '';
    }

    const location = order.delivery.agentLiveLocation;
    return `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
  }

  getLiveRouteUrl(order: any) {
    if (!this.hasAgentLiveLocation(order) || !this.hasDeliveryLocation(order)) {
      return '';
    }

    return `https://www.google.com/maps/dir/?api=1&origin=${order.delivery.agentLiveLocation.latitude},${order.delivery.agentLiveLocation.longitude}&destination=${order.deliveryLocation.latitude},${order.deliveryLocation.longitude}&travelmode=driving`;
  }

  canAssignDeliveryAgent(order: any) {
    return (
      order?.fulfillmentMode === 'delivery' &&
      !['fulfilled', 'cancelled'].includes(String(order?.status || '').toLowerCase())
    );
  }

  shouldShowTracking(order: any) {
    return (
      order?.fulfillmentMode === 'delivery' &&
      !!order?.delivery?.assignedAgentId &&
      String(order?.status || '').toLowerCase() === 'in-delivery'
    );
  }

  private mergeTrackedOrder(tracking: any) {
    if (!tracking?._id) {
      return;
    }

    this.onlineOrders = this.onlineOrders.map((order) =>
      order._id === tracking._id
        ? {
            ...order,
            status: tracking.status,
            updatedAt: tracking.updatedAt,
            deliveryAddress: tracking.deliveryAddress ?? order.deliveryAddress,
            deliveryLocation: tracking.deliveryLocation ?? order.deliveryLocation,
            delivery: {
              ...(order.delivery || {}),
              assignedAgentId: tracking.assignedAgent || order.delivery?.assignedAgentId || null,
              agentLiveLocation: tracking.agentLiveLocation || null,
            },
          }
        : order
    );

    if (this.selectedOrder?._id === tracking._id) {
      this.selectedOrder = this.onlineOrders.find((order) => order._id === tracking._id) || this.selectedOrder;
      this.selectedStatus = this.selectedOrder?.status || this.selectedStatus;
    }

    this.filterOrders();
  }

  refreshSelectedOrderTracking() {
    if (!this.selectedOrder?._id || this.trackingRefreshInProgress) {
      return;
    }

    this.trackingRefreshInProgress = true;
    this.onlineOrderService.getOrderTracking(this.selectedOrder._id).subscribe({
      next: (res: any) => {
        this.trackingRefreshInProgress = false;
        this.mergeTrackedOrder(res.tracking);
        this.cdr.detectChanges();
      },
      error: () => {
        this.trackingRefreshInProgress = false;
      },
    });
  }

  startTrackingPollingIfNeeded() {
    if (!this.shouldShowTracking(this.selectedOrder)) {
      return;
    }

    this.refreshSelectedOrderTracking();
    this.trackingPollId = setInterval(() => {
      this.refreshSelectedOrderTracking();
    }, 15000);
  }

  stopTrackingPolling() {
    if (this.trackingPollId) {
      clearInterval(this.trackingPollId);
      this.trackingPollId = null;
    }
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
    if (!this.hasDeliveryLocation(order)) return 'Location not shared';

    return order?.deliveryLocation?.address || order?.deliveryLocation?.label || 'Shared current location';
  }

  getDeliveryLocationMapUrl(order: any) {
    if (!this.hasDeliveryLocation(order)) return '';

    return `https://www.google.com/maps?q=${order.deliveryLocation.latitude},${order.deliveryLocation.longitude}`;
  }

  getDeliveryLocationEmbedUrl(order: any): SafeResourceUrl | null {
    if (!this.hasDeliveryLocation(order)) return null;

    const { latitude, longitude } = order.deliveryLocation;
    const mapUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`;

    return this.sanitizer.bypassSecurityTrustResourceUrl(mapUrl);
  }

  getOnlinePaymentStatus(order: any) {
    return order?.onlinePayment?.status || 'unpaid';
  }

  hasSettledOnlinePayment(order: any) {
    return this.getOnlinePaymentStatus(order) === 'paid';
  }

  resetFulfillmentPayment(order: any) {
    const remainingBalance = Number(order?.saleId?.balance_amount ?? order?.total ?? 0);
    const paymentStatus = this.hasSettledOnlinePayment(order)
      ? 'paid'
      : order?.saleId?.payment_status || 'unpaid';

    this.fulfillmentPayment = {
      paymentStatus,
      amount: this.hasSettledOnlinePayment(order)
        ? null
        : paymentStatus === 'paid'
          ? remainingBalance
          : null,
      payment_method: this.hasSettledOnlinePayment(order) ? 'upi' : 'cash',
      transaction_id: order?.onlinePayment?.paymentId || '',
      cheque_no: '',
    };
  }

  onSelectedStatusChange() {
    if (this.selectedStatus === 'fulfilled') {
      this.resetFulfillmentPayment(this.selectedOrder);
    }
  }

  onFulfillmentPaymentStatusChange() {
    if (this.hasSettledOnlinePayment(this.selectedOrder)) {
      this.fulfillmentPayment.amount = null;
      this.fulfillmentPayment.payment_method = 'upi';
      this.fulfillmentPayment.transaction_id =
        this.selectedOrder?.onlinePayment?.paymentId || '';
      return;
    }

    if (this.fulfillmentPayment.paymentStatus === 'paid') {
      this.fulfillmentPayment.amount = this.getRemainingBalance();
      return;
    }

    if (this.fulfillmentPayment.paymentStatus === 'unpaid') {
      this.fulfillmentPayment.amount = null;
      this.fulfillmentPayment.transaction_id = '';
      this.fulfillmentPayment.cheque_no = '';
    } else {
      this.fulfillmentPayment.amount = null;
    }
  }

  getRemainingBalance() {
    if (this.hasSettledOnlinePayment(this.selectedOrder)) {
      return Number(this.selectedOrder?.saleId?.balance_amount ?? 0);
    }

    return Number(this.selectedOrder?.saleId?.balance_amount ?? this.selectedOrder?.total ?? 0);
  }

  requiresPaymentEntry() {
    if (this.hasSettledOnlinePayment(this.selectedOrder)) {
      return false;
    }

    return this.fulfillmentPayment.paymentStatus === 'paid' || this.fulfillmentPayment.paymentStatus === 'partial';
  }

  updateSelectedOrderStatus() {
    const orgId = this.auth.currentUserValue?.org_id;
    const orderId = this.selectedOrder?._id;

    if (!orgId || !orderId || !this.selectedStatus) {
      this.statusActionMessage = 'Unable to update order status.';
      return;
    }

    const payload: any = {
      status: this.selectedStatus,
    };

    if (this.selectedStatus === 'fulfilled') {
      if (!this.fulfillmentPayment.paymentStatus) {
        this.statusActionMessage = 'Select the payment status before fulfilling the order.';
        return;
      }

      if (this.requiresPaymentEntry()) {
        const amount = Number(this.fulfillmentPayment.amount);

        if (!amount || amount <= 0) {
          this.statusActionMessage = 'Enter a valid payment amount.';
          return;
        }
      }

      payload.payment = { ...this.fulfillmentPayment };
    }

    this.statusUpdateInProgress = true;
    this.statusActionMessage = '';

    this.onlineOrderService
      .updateOnlineOrderStatus(orgId, orderId, payload)
      .subscribe({
        next: (res: any) => {
          const updatedOrder = res.order;

          this.onlineOrders = this.onlineOrders.map((order) =>
            order._id === updatedOrder._id ? updatedOrder : order
          );
          this.filterOrders();
          this.selectedOrder = updatedOrder;
        this.selectedStatus = updatedOrder.status;
        this.resetFulfillmentPayment(updatedOrder);
          this.statusActionMessage = res.saleCreated
            ? 'Order status updated and sale created.'
            : 'Order status updated successfully.';
        this.statusUpdateInProgress = false;
        this.stopTrackingPolling();
        this.startTrackingPollingIfNeeded();
        this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error updating online order status:', err);
          this.statusActionMessage =
            err.error?.message || 'Failed to update order status.';
          this.statusUpdateInProgress = false;
        },
      });
  }

  assignSelectedAgent() {
    const orderId = this.selectedOrder?._id;

    if (!orderId || !this.selectedAgentId) {
      this.statusActionMessage = 'Select a delivery agent first.';
      return;
    }

    this.assignmentInProgress = true;
    this.onlineOrderService.assignDeliveryAgent(orderId, this.selectedAgentId).subscribe({
      next: (res: any) => {
        const updatedOrder = res.order;
        this.onlineOrders = this.onlineOrders.map((order) =>
          order._id === updatedOrder._id ? updatedOrder : order
        );
        this.filterOrders();
        this.selectedOrder = updatedOrder;
        this.selectedStatus = updatedOrder.status;
        this.selectedAgentId =
          updatedOrder?.delivery?.assignedAgentId?._id || updatedOrder?.delivery?.assignedAgentId || '';
        this.assignmentInProgress = false;
        this.statusActionMessage = res.saleCreated
          ? 'Delivery agent assigned and sale created.'
          : 'Delivery agent assigned successfully.';
        this.toast.showSuccess(this.statusActionMessage);
        this.stopTrackingPolling();
        this.startTrackingPollingIfNeeded();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.assignmentInProgress = false;
        this.statusActionMessage = err.error?.message || 'Failed to assign delivery agent.';
        this.toast.showError(this.statusActionMessage);
        this.cdr.detectChanges();
      },
    });
  }
}
