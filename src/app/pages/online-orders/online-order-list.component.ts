import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../auth/auth.service';
import { HeaderComponent } from '../../partials/header/header.component';
import { OnlineOrderService } from './online-order.service';

@Component({
  selector: 'app-online-order-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, CurrencyPipe, DatePipe],
  templateUrl: './online-order-list.component.html',
})
export class OnlineOrderListComponent implements OnInit {
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

  loading = true;
  errorMessage = '';
  searchTerm = '';

  page = 1;
  pageSize = 10;
  pageSizes = [5, 10, 25, 50];

  selectedOrder: any = null;
  selectedStatus = 'pending';
  showDetailsPopup = false;
  statusUpdateInProgress = false;
  statusActionMessage = '';
  fulfillmentPayment: any = {
    paymentStatus: 'unpaid',
    amount: null,
    payment_method: 'cash',
    transaction_id: '',
    cheque_no: '',
  };

  constructor(
    private onlineOrderService: OnlineOrderService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.currentOrg = this.auth.currentUserValue?.org;
    this.fetchOnlineOrders();
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
    this.selectedOrder = order;
    this.selectedStatus = order?.status || 'pending';
    this.resetFulfillmentPayment(order);
    this.statusActionMessage = '';
    this.showDetailsPopup = true;
  }

  closeOrderDetails() {
    this.showDetailsPopup = false;
    this.selectedOrder = null;
    this.selectedStatus = 'pending';
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
}
