import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from './settings.service';
import { AuthService } from '../../auth/auth.service';
import { ToastService } from '../../services/toast.service';
import { HeaderComponent } from '../../partials/header/header.component';
import { catchError, finalize, forkJoin, map, switchMap, throwError } from 'rxjs';

@Component({
  selector: 'settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.css']
})
export class SettingsComponent implements OnInit {
  savingOrg = false;
  capturingLocation = false;

  user: any = this.createDefaultUser();
  org: any = this.createDefaultOrg();
  sop: any = this.createDefaultSop();

  constructor(
    private settingsService: SettingsService,
    private auth: AuthService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadSettings();
  }

  private createDefaultUser() {
    return {
      name: '',
      phone: '',
      password: '',
    };
  }

  private createDefaultOrg() {
    return {
      name: '',
      gst: '',
      phone: '',
      address: '',
      shopLocation: {
        latitude: null as number | null,
        longitude: null as number | null,
      },
      razorpay_key: '',
      razorpay_secret: '',
      razorpay_webhook_secret: '',
      has_razorpay_secret: false,
      has_razorpay_webhook_secret: false,
    };
  }

  private createDefaultSop() {
    return {
      delivery: {
        enabled: true,
        minimumOrder: 150,
        radiusKm: null as number | null,
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

  private loadSettings() {
    const orgId = this.auth.currentUserValue?.org_id;

    if (!orgId) {
      this.toast.showError('Organisation not found');
      this.cdr.detectChanges();
      return;
    }

    forkJoin({
      user: this.settingsService.getUserSettings(orgId),
      org: this.settingsService.getOrgSettings(orgId),
      sop: this.settingsService.getSopSettings(orgId),
    }).subscribe({
      next: ({ user, org, sop }) => {
        this.user = {
          ...this.createDefaultUser(),
          ...user.user,
          password: '',
        };

        this.org = {
          ...this.createDefaultOrg(),
          ...org.org,
          shopLocation: {
            latitude: org.org?.shopLocation?.latitude ?? null,
            longitude: org.org?.shopLocation?.longitude ?? null,
          },
          razorpay_secret: '',
          razorpay_webhook_secret: '',
        };

        const defaultSop = this.createDefaultSop();
        this.sop = {
          ...defaultSop,
          ...sop.sop,
          delivery: { ...defaultSop.delivery, ...sop.sop?.delivery },
          payment: { ...defaultSop.payment, ...sop.sop?.payment },
          shop: { ...defaultSop.shop, ...sop.sop?.shop },
          rules: { ...defaultSop.rules, ...sop.sop?.rules },
        };

        this.cdr.detectChanges();
      },
      error: (err) => {
        this.toast.showError(err.error?.message || 'Unable to load settings');
        this.cdr.detectChanges();
      },
    });
  }

  hasShopLocation(): boolean {
    return (
      this.org.shopLocation?.latitude !== null &&
      this.org.shopLocation?.longitude !== null
    );
  }

  captureCurrentLocation() {
    if (!navigator.geolocation) {
      this.toast.showError('Location capture is not supported in this browser');
      this.cdr.detectChanges();
      return;
    }

    this.capturingLocation = true;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        this.org.shopLocation = {
          latitude: Number(coords.latitude.toFixed(6)),
          longitude: Number(coords.longitude.toFixed(6)),
        };
        this.capturingLocation = false;
        this.toast.showSuccess('Shop location captured');
        this.cdr.detectChanges();
      },
      (error) => {
        let message = 'Unable to capture current location';

        if (error.code === error.PERMISSION_DENIED) {
          message = 'Location permission was denied';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = 'Current location is unavailable';
        } else if (error.code === error.TIMEOUT) {
          message = 'Location request timed out';
        }

        this.capturingLocation = false;
        this.toast.showError(message);
        this.cdr.detectChanges();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  }

  saveUserSettings() {
    const userId = this.auth.currentUserValue?.id;

    this.settingsService.updateUserSettings(userId??"", this.user).subscribe({
      next: () => this.toast.showSuccess("User settings updated!"),
      error: err => this.toast.showError(err.error?.message || "Update failed"),
    });
    this.cdr.detectChanges();
  }

  saveOrgSettings() {
    const orgId = this.auth.currentUserValue?.org_id;

    if (!orgId) {
      this.toast.showError('Organisation not found');
      this.cdr.detectChanges();
      return;
    }

    this.savingOrg = true;
    const radiusKm = this.sop.delivery.radiusKm;
    const sopPayload = {
      ...this.sop,
      delivery: {
        ...this.sop.delivery,
        radiusKm: radiusKm === null || radiusKm === '' ? null : Number(radiusKm),
      },
    };

    this.settingsService.updateOrgSettings(orgId, this.org).pipe(
      switchMap((orgRes: any) =>
        this.settingsService.updateSopSettings(orgId, sopPayload).pipe(
          map((sopRes: any) => ({ orgRes, sopRes })),
          catchError((error) =>
            throwError(() => ({
              stage: 'sop',
              error,
              orgRes,
            })),
          ),
        ),
      ),
      catchError((error) =>
        throwError(() => ({
          stage: error?.stage || 'org',
          error: error?.error || error,
          orgRes: error?.orgRes,
        })),
      ),
      finalize(() => {
        this.savingOrg = false;
        this.cdr.detectChanges();
      }),
    ).subscribe({
      next: ({ orgRes, sopRes }) => {
        this.org = {
          ...this.createDefaultOrg(),
          ...orgRes.org,
          shopLocation: {
            latitude: orgRes.org?.shopLocation?.latitude ?? null,
            longitude: orgRes.org?.shopLocation?.longitude ?? null,
          },
          razorpay_secret: '',
          razorpay_webhook_secret: '',
        };

        const defaultSop = this.createDefaultSop();
        this.sop = {
          ...defaultSop,
          ...sopRes.sop,
          delivery: { ...defaultSop.delivery, ...sopRes.sop?.delivery },
          payment: { ...defaultSop.payment, ...sopRes.sop?.payment },
          shop: { ...defaultSop.shop, ...sopRes.sop?.shop },
          rules: { ...defaultSop.rules, ...sopRes.sop?.rules },
        };

        this.auth.updateCurrentUserOrganisation(orgRes.org);
        this.toast.showSuccess('Organisation settings updated!');
      },
      error: (failure) => {
        if (failure.stage === 'sop') {
          if (failure.orgRes?.org) {
            this.auth.updateCurrentUserOrganisation(failure.orgRes.org);
          }
          this.toast.showError(
            'Organisation settings were saved, but delivery radius could not be updated. Reloading current values.',
          );
        } else {
          this.toast.showError(
            failure.error?.error?.message ||
              failure.error?.message ||
              'Update failed',
          );
        }

        this.loadSettings();
      },
    });
  }
}
