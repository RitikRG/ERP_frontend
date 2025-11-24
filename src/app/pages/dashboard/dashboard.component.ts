// src/app/pages/dashboard/dashboard.component.ts
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { HeaderComponent } from '../../partials/header/header.component';
import { AuthService } from '../../auth/auth.service';
import { DashboardService } from './dashboard.service';

import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, HeaderComponent, CurrencyPipe, NgChartsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  loading = true;
  errorMessage = '';

  summary: any = null;
  projections: any = null;

  // --------------------------------------------------
  //  DOUGHNUT: SALES VS PURCHASES
  // --------------------------------------------------
  salesVsPurchaseData: ChartConfiguration<'doughnut'>['data'] = {
    labels: ['Sales', 'Purchases'],
    datasets: [{
      data: [0, 0],
      backgroundColor: ['#2563EB', '#10B981'],
      hoverOffset: 5
    }]
  };

  doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' }
    }
  };


  // --------------------------------------------------
  //  HORIZONTAL BAR: SALE PAYMENT METHODS
  // --------------------------------------------------
  salesMethodBarData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      {
        label: 'Amount',
        data: [],
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
        borderRadius: 6
      }
    ]
  };

  horizontalBarOptions: ChartOptions<'bar'> = {
    responsive: true,
    indexAxis: 'y',
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { display: false } }
    }
  };


  // --------------------------------------------------
  //  PIE: PURCHASE PAYMENT METHODS
  // --------------------------------------------------
  purchaseMethodPieData: ChartConfiguration<'pie'>['data'] = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: ['#10B981', '#3B82F6', '#F97316', '#EF4444']
    }]
  };

  pieOptions: ChartOptions<'pie'> = {
    responsive: true,
    plugins: { legend: { position: 'bottom' } }
  };


  // --------------------------------------------------
  //  LINE CHARTS: SALES/PURCHASE TRENDS (30 Days)
  // --------------------------------------------------
  salesTrendLineData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [{
      data: [],
      label: "Sales",
      borderColor: '#2563EB',
      pointRadius: 2,
      tension: 0.3,
      fill: false
    }]
  };

  purchaseTrendLineData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [{
      data: [],
      label: "Purchases",
      borderColor: '#10B981',
      pointRadius: 2,
      tension: 0.3,
      fill: false
    }]
  };

  trendOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { x: {}, y: { beginAtZero: true } }
  };


  constructor(
    private auth: AuthService,
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const org_id = this.auth.currentUserValue?.org_id;

    this.dashboardService.getSummary(org_id ?? "").subscribe({
      next: (res) => {
        this.summary = res.data;
        this.loading = false;

        this.updateGraphs();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to load dashboard';
        this.loading = false;
      }
    });
  }

  // --------------------------------------------------
  // UPDATE GRAPH DATA
  // --------------------------------------------------
  updateGraphs() {

    // DOUGHNUT
    this.salesVsPurchaseData.datasets[0].data = [
      this.summary.sales.totalAmount,
      this.summary.purchases.totalAmount
    ];

    // HORIZONTAL BAR
    this.salesMethodBarData.labels = this.summary.salesPayments.byMethod.map((m: any) => m._id);
    this.salesMethodBarData.datasets[0].data = this.summary.salesPayments.byMethod.map((m: any) => m.totalAmount);

    // PIE CHART
    this.purchaseMethodPieData.labels = this.summary.purchasePayments.byMethod.map((m: any) => m._id);
    this.purchaseMethodPieData.datasets[0].data = this.summary.purchasePayments.byMethod.map((m: any) => m.totalAmount);

    // SALES TREND
    if (this.summary.sales.last30Days) {
      this.salesTrendLineData.labels = this.summary.sales.last30Days.map((d: any) => d.date);
      this.salesTrendLineData.datasets[0].data = this.summary.sales.last30Days.map((d: any) => d.total);
    }

    // PURCHASE TREND
    if (this.summary.purchases.last30Days) {
      this.purchaseTrendLineData.labels = this.summary.purchases.last30Days.map((d: any) => d.date);
      this.purchaseTrendLineData.datasets[0].data = this.summary.purchases.last30Days.map((d: any) => d.total);
    }
  }

}
