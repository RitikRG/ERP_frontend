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
  showDetailsPopup = false;

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
    this.showDetailsPopup = true;
  }

  closeOrderDetails() {
    this.showDetailsPopup = false;
    this.selectedOrder = null;
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
}
