import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { HeaderComponent } from '../../partials/header/header.component';
import { ToastService } from '../../services/toast.service';
import { SettingsService } from './settings.service';

@Component({
  selector: 'app-sop-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './sop-settings.component.html',
  styleUrls: ['./sop-settings.component.css'],
})
export class SopSettingsComponent implements OnInit {
  loading = true;
  saving = false;

  sop = this.createDefaultSop();

  constructor(
    private settingsService: SettingsService,
    private auth: AuthService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadSopSettings();
  }

  private createDefaultSop() {
    return {
      delivery: {
        enabled: true,
        minimumOrder: 150,
        hoursStart: '09:00',
        hoursEnd: '21:00',
        days: 'Monday to Saturday',
      },
      payment: {
        cod: true,
        upi: true,
      },
      shop: {
        openTime: '09:00',
        closeTime: '21:00',
        weeklyOff: 'Sunday',
        contact: '',
      },
      rules: {
        allowSubstitutions: true,
        partialOrders: true,
        maxItems: null as number | null,
        specialInstructions: '',
      },
    };
  }

  loadSopSettings(): void {
    const orgId = this.auth.currentUserValue?.org_id;

    if (!orgId) {
      this.loading = false;
      this.toast.showError('Organisation not found');
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.settingsService.getSopSettings(orgId).subscribe({
      next: (res) => {
        const defaults = this.createDefaultSop();
        this.sop = {
          ...defaults,
          ...res.sop,
          delivery: { ...defaults.delivery, ...res.sop?.delivery },
          payment: { ...defaults.payment, ...res.sop?.payment },
          shop: { ...defaults.shop, ...res.sop?.shop },
          rules: { ...defaults.rules, ...res.sop?.rules },
        };
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.toast.showError(err.error?.message || 'Unable to load SOP settings');
        this.cdr.detectChanges();
      },
    });
  }

  saveSopSettings(): void {
    const orgId = this.auth.currentUserValue?.org_id;

    if (!orgId) {
      this.toast.showError('Organisation not found');
      this.cdr.detectChanges();
      return;
    }

    this.saving = true;
    const maxItems = this.sop.rules.maxItems;
    const payload = {
      ...this.sop,
      rules: {
        ...this.sop.rules,
        maxItems: maxItems === null ? null : Number(maxItems),
      },
    };

    this.settingsService.updateSopSettings(orgId, payload).subscribe({
      next: (res) => {
        if (res?.sop) {
          this.sop = res.sop;
        }
        this.saving = false;
        this.toast.showSuccess('SOP settings updated!');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.saving = false;
        this.toast.showError(err.error?.message || 'Unable to update SOP settings');
        this.cdr.detectChanges();
      },
    });
  }
}
