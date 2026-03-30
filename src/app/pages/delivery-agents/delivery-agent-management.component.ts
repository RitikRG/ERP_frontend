import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../partials/header/header.component';
import { DeliveryAgentService } from './delivery-agent.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-delivery-agent-management',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, DatePipe],
  templateUrl: './delivery-agent-management.component.html',
})
export class DeliveryAgentManagementComponent implements OnInit {
  agents: any[] = [];
  loading = true;
  errorMessage = '';
  creating = false;
  saving = false;
  showEditPopup = false;
  selectedAgent: any = null;

  newAgent = this.createAgentForm();
  editAgent = this.createEditForm();

  constructor(
    private deliveryAgentService: DeliveryAgentService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.loadAgents();
  }

  private createAgentForm() {
    return {
      name: '',
      email: '',
      phone: '',
      password: '',
    };
  }

  private createEditForm() {
    return {
      name: '',
      phone: '',
      password: '',
      isActive: true,
    };
  }

  loadAgents() {
    this.loading = true;
    this.deliveryAgentService.getAgents().subscribe({
      next: (res: any) => {
        this.agents = res.agents || [];
        this.loading = false;
        this.errorMessage = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Failed to load delivery agents.';
        this.cdr.detectChanges();
      },
    });
  }

  createAgent() {
    if (!this.newAgent.name || !this.newAgent.email || !this.newAgent.password) {
      this.toast.showError('Name, email, and password are required.');
      return;
    }

    this.creating = true;
    this.deliveryAgentService.createAgent(this.newAgent).subscribe({
      next: () => {
        this.creating = false;
        this.newAgent = this.createAgentForm();
        this.toast.showSuccess('Delivery agent created successfully.');
        this.loadAgents();
      },
      error: (err) => {
        this.creating = false;
        this.toast.showError(err.error?.message || 'Failed to create delivery agent.');
        this.cdr.detectChanges();
      },
    });
  }

  openEdit(agent: any) {
    this.selectedAgent = agent;
    this.editAgent = {
      name: agent.name || '',
      phone: agent.phone || '',
      password: '',
      isActive: agent.isActive !== false,
    };
    this.showEditPopup = true;
  }

  closeEdit() {
    this.showEditPopup = false;
    this.selectedAgent = null;
    this.editAgent = this.createEditForm();
  }

  saveEdit() {
    if (!this.selectedAgent?._id) {
      return;
    }

    this.saving = true;
    this.deliveryAgentService
      .updateAgent(this.selectedAgent._id, this.editAgent)
      .subscribe({
        next: () => {
          this.saving = false;
          this.toast.showSuccess('Delivery agent updated successfully.');
          this.closeEdit();
          this.loadAgents();
        },
        error: (err) => {
          this.saving = false;
          this.toast.showError(err.error?.message || 'Failed to update delivery agent.');
          this.cdr.detectChanges();
        },
      });
  }
}
