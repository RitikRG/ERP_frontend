import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from './settings.service';
import { AuthService } from '../../auth/auth.service';
import { ToastService } from '../../services/toast.service';
import { HeaderComponent } from '../../partials/header/header.component';

@Component({
  selector: 'settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.css']
})
export class SettingsComponent implements OnInit {

  user: any = {
    name: '',
    phone: '',
    password: ''
  };

  org: any = {
    name: '',
    gst: '',
    phone: '',
    address: '',
    razorpay_key: ''
  };

  constructor(
    private settingsService: SettingsService,
    private auth: AuthService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const u = this.auth.currentUserValue;
    const org_id = u?.org_id;
    
    // Load user & org settings
    this.settingsService.getUserSettings(org_id??"").subscribe(res => {
      this.user.name = res.user.name;
      this.user.phone = res.user.phone;
        this.cdr.detectChanges();
    });

    this.settingsService.getOrgSettings(org_id??"").subscribe(res => {
      this.org = res.org;
    });
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

    this.settingsService.updateOrgSettings(orgId??"", this.org).subscribe({
      next: () => this.toast.showSuccess("Organisation settings updated!"),
      error: err => this.toast.showError(err.error?.message || "Update failed")
    });
  }
}
