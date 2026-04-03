import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import { HeaderComponent } from '../../partials/header/header.component';
import { AuthService } from '../../auth/auth.service';
import { DashboardService } from './dashboard.service';

interface PaymentMethodSummary {
  _id: string;
  totalAmount: number;
  count: number;
}

interface DailyTrendSummary {
  date: string;
  label: string;
  totalAmount: number;
  count: number;
}

interface AmountSummary {
  totalAmount: number;
  paid: number;
  balance: number;
  count: number;
}

interface PaymentSummary {
  byMethod: PaymentMethodSummary[];
  doneAmount: number;
  dueAmount: number;
}

interface InventorySummary {
  totalProducts: number;
  totalQuantity: number;
  totalStockValue: number;
}

interface SupplierSummary {
  count: number;
}

interface OnlineOrdersSummary {
  totalAmount: number;
  count: number;
  averageOrderValue: number;
  byStatus: PaymentMethodSummary[];
  byPaymentMethod: PaymentMethodSummary[];
  byFulfillmentMode: PaymentMethodSummary[];
  trend: DailyTrendSummary[];
}

interface DashboardSummary {
  sales: AmountSummary;
  salesPayments: PaymentSummary;
  purchases: AmountSummary;
  purchasePayments: PaymentSummary;
  inventory: InventorySummary;
  suppliers: SupplierSummary;
  onlineOrders: OnlineOrdersSummary;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, HeaderComponent, CurrencyPipe, NgChartsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  loading = true;
  errorMessage = '';
  summary: DashboardSummary | null = null;

  private readonly monochromePalette = ['#040505', '#775a00', '#c8c6c5', '#ba1a1a', '#88867b'];
  private readonly warmPalette = ['#ffd571', '#eac15f', '#775a00', '#ba1a1a', '#c8c6c5'];
  private readonly onlineOrderPalette = ['#040505', '#ffd571', '#775a00', '#4f7b66', '#ba1a1a'];

  salesVsPurchaseData: ChartConfiguration<'doughnut'>['data'] = {
    labels: ['Sales', 'Purchases'],
    datasets: [
      {
        data: [0, 0],
        backgroundColor: ['#040505', '#ffd571'],
        borderWidth: 0,
        hoverOffset: 8,
      },
    ],
  };

  doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#444748',
          font: { family: 'Inter', size: 12, weight: 700 },
          padding: 18,
        },
      },
      tooltip: {
        backgroundColor: '#1f1e16',
        titleFont: { family: 'Plus Jakarta Sans', weight: 700 },
        bodyFont: { family: 'Inter' },
      },
    },
  };

  salesMethodBarData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      {
        label: 'Amount',
        data: [],
        backgroundColor: [],
        borderRadius: 999,
        borderSkipped: false,
        barThickness: 16,
      },
    ],
  };

  horizontalBarOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1f1e16',
        titleFont: { family: 'Plus Jakarta Sans', weight: 700 },
        bodyFont: { family: 'Inter' },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: 'rgba(116, 120, 120, 0.12)' },
        ticks: { color: '#444748', font: { family: 'Inter' } },
      },
      y: {
        grid: { display: false },
        ticks: { color: '#444748', font: { family: 'Inter', weight: 600 } },
      },
    },
  };

  purchaseMethodPieData: ChartConfiguration<'pie'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [],
        borderWidth: 0,
      },
    ],
  };

  pieOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#444748',
          font: { family: 'Inter', size: 12, weight: 700 },
          padding: 18,
        },
      },
      tooltip: {
        backgroundColor: '#1f1e16',
        titleFont: { family: 'Plus Jakarta Sans', weight: 700 },
        bodyFont: { family: 'Inter' },
      },
    },
  };

  onlineOrderStatusData: ChartConfiguration<'doughnut'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [],
        borderWidth: 0,
        hoverOffset: 8,
      },
    ],
  };

  onlineOrderPaymentData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      {
        label: 'Orders',
        data: [],
        backgroundColor: [],
        borderRadius: 999,
        borderSkipped: false,
        barThickness: 16,
      },
    ],
  };

  onlineOrderTrendData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        label: 'Orders',
        data: [],
        borderColor: '#040505',
        backgroundColor: 'rgba(255, 213, 113, 0.24)',
        pointBackgroundColor: '#775a00',
        pointBorderColor: '#040505',
        pointRadius: 4,
        pointHoverRadius: 5,
        borderWidth: 3,
        tension: 0.35,
        fill: true,
      },
    ],
  };

  lineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1f1e16',
        titleFont: { family: 'Plus Jakarta Sans', weight: 700 },
        bodyFont: { family: 'Inter' },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#444748', font: { family: 'Inter' } },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(116, 120, 120, 0.12)' },
        ticks: {
          precision: 0,
          color: '#444748',
          font: { family: 'Inter' },
        },
      },
    },
  };

  constructor(
    private auth: AuthService,
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const orgId = this.auth.currentUserValue?.org_id ?? '';

    this.dashboardService.getSummary(orgId).subscribe({
      next: (response) => {
        this.summary = response.data as DashboardSummary;
        this.loading = false;
        this.updateCharts();
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to load dashboard';
        this.loading = false;
      },
    });
  }

  get salesTotal(): number {
    return this.summary?.sales.totalAmount ?? 0;
  }

  get purchaseTotal(): number {
    return this.summary?.purchases.totalAmount ?? 0;
  }

  get onlineOrderTotal(): number {
    return this.summary?.onlineOrders.totalAmount ?? 0;
  }

  get onlineOrderCount(): number {
    return this.summary?.onlineOrders.count ?? 0;
  }

  get onlineOrderAverageValue(): number {
    return this.summary?.onlineOrders.averageOrderValue ?? 0;
  }

  get paymentMethodLeader(): string {
    const leader = this.summary?.salesPayments.byMethod?.[0];
    return leader ? this.formatPaymentMethod(leader._id) : 'No payment data yet';
  }

  get purchaseMethodLeader(): string {
    const leader = this.summary?.purchasePayments.byMethod?.[0];
    return leader ? this.formatPaymentMethod(leader._id) : 'No payment data yet';
  }

  get onlineOrderStatusLeader(): string {
    const leader = this.summary?.onlineOrders.byStatus?.[0];
    return leader ? this.formatStatus(leader._id) : 'No online orders yet';
  }

  get onlineOrderPaymentLeader(): string {
    const leader = this.summary?.onlineOrders.byPaymentMethod?.[0];
    return leader ? this.formatPaymentMethod(leader._id) : 'No checkout data yet';
  }

  get onlineOrderTrendLeader(): string {
    const trend = this.summary?.onlineOrders.trend ?? [];
    const totalOrders = trend.reduce((sum, item) => sum + (item.count || 0), 0);
    return `${totalOrders} orders in 7 days`;
  }

  get salesPurchaseRatio(): string {
    if (!this.purchaseTotal) {
      return this.salesTotal ? 'Sales only' : '0:0';
    }

    return `${(this.salesTotal / this.purchaseTotal).toFixed(1)} : 1`;
  }

  get salesVsPurchaseHasData(): boolean {
    return this.salesVsPurchaseValues.some((value) => value > 0);
  }

  get salesVsPurchaseValues(): number[] {
    const data = this.salesVsPurchaseData.datasets[0]?.data ?? [];
    return data.map((value) => Number(value) || 0);
  }

  get salesMethodHasData(): boolean {
    const values = this.salesMethodBarData.datasets[0]?.data ?? [];
    return values.some((value) => Number(value) > 0);
  }

  get purchaseMethodHasData(): boolean {
    const values = this.purchaseMethodPieData.datasets[0]?.data ?? [];
    return values.some((value) => Number(value) > 0);
  }

  get onlineOrderStatusHasData(): boolean {
    const values = this.onlineOrderStatusData.datasets[0]?.data ?? [];
    return values.some((value) => Number(value) > 0);
  }

  get onlineOrderPaymentHasData(): boolean {
    const values = this.onlineOrderPaymentData.datasets[0]?.data ?? [];
    return values.some((value) => Number(value) > 0);
  }

  get onlineOrderTrendHasData(): boolean {
    const values = this.onlineOrderTrendData.datasets[0]?.data ?? [];
    return values.some((value) => Number(value) > 0);
  }

  formatPaymentMethod(value: string | null | undefined): string {
    if (!value) {
      return 'Unknown';
    }

    return value
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  formatStatus(value: string | null | undefined): string {
    if (!value) {
      return 'Unknown';
    }

    return this.formatPaymentMethod(value);
  }

  getOnlineOrderStatusCount(status: string): number {
    const breakdown = this.summary?.onlineOrders.byStatus ?? [];
    return breakdown.find((entry) => entry._id === status)?.count ?? 0;
  }

  private updateCharts() {
    if (!this.summary) {
      return;
    }

    this.salesVsPurchaseData.datasets[0].data = [this.summary.sales.totalAmount, this.summary.purchases.totalAmount];

    const salesByMethod = this.summary.salesPayments.byMethod ?? [];
    this.salesMethodBarData.labels = salesByMethod.map((method) => this.formatPaymentMethod(method._id));
    this.salesMethodBarData.datasets[0].data = salesByMethod.map((method) => method.totalAmount);
    this.salesMethodBarData.datasets[0].backgroundColor = this.buildPalette(
      this.monochromePalette,
      salesByMethod.length
    );

    const purchaseByMethod = this.summary.purchasePayments.byMethod ?? [];
    this.purchaseMethodPieData.labels = purchaseByMethod.map((method) => this.formatPaymentMethod(method._id));
    this.purchaseMethodPieData.datasets[0].data = purchaseByMethod.map((method) => method.totalAmount);
    this.purchaseMethodPieData.datasets[0].backgroundColor = this.buildPalette(
      this.warmPalette,
      purchaseByMethod.length
    );

    const onlineOrdersByStatus = this.summary.onlineOrders.byStatus ?? [];
    this.onlineOrderStatusData.labels = onlineOrdersByStatus.map((entry) =>
      this.formatStatus(entry._id)
    );
    this.onlineOrderStatusData.datasets[0].data = onlineOrdersByStatus.map((entry) => entry.count);
    this.onlineOrderStatusData.datasets[0].backgroundColor = this.buildPalette(
      this.onlineOrderPalette,
      onlineOrdersByStatus.length
    );

    const onlineOrdersByPaymentMethod = this.summary.onlineOrders.byPaymentMethod ?? [];
    this.onlineOrderPaymentData.labels = onlineOrdersByPaymentMethod.map((entry) =>
      this.formatPaymentMethod(entry._id)
    );
    this.onlineOrderPaymentData.datasets[0].data = onlineOrdersByPaymentMethod.map(
      (entry) => entry.count
    );
    this.onlineOrderPaymentData.datasets[0].backgroundColor = this.buildPalette(
      this.warmPalette,
      onlineOrdersByPaymentMethod.length
    );

    const onlineOrderTrend = this.summary.onlineOrders.trend ?? [];
    this.onlineOrderTrendData.labels = onlineOrderTrend.map((entry) => entry.label);
    this.onlineOrderTrendData.datasets[0].data = onlineOrderTrend.map((entry) => entry.count);
  }

  private buildPalette(source: string[], count: number): string[] {
    if (!count) {
      return source.slice(0, 2);
    }

    return Array.from({ length: count }, (_, index) => source[index % source.length]);
  }
}
