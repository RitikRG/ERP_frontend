import { Component, OnInit, ChangeDetectorRef  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SupplierService } from './supplier.service';
import { AuthService } from '../../auth/auth.service';
import { HeaderComponent } from '../../partials/header/header.component';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'supplier-list',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FormsModule, FontAwesomeModule],
  templateUrl: './suppliersList.component.html',
  styleUrls: ['./supplier.css'],
})
export class SupplierListComponent implements OnInit {
  // icons
  faEdit = faEdit;
  faTrash = faTrash;

  suppliers: any[] = [];
  filteredSuppliers: any[] = [];
  loading = true;
  errorMessage = '';
  searchTerm = '';

  // Pagination
  page = 1;
  pageSize = 10;  
  pageSizes = [5,10, 25, 50];
  paginatedSuppliers: any[] = [];

  // Confirmation popup
  showConfirmPopup = false;
  showConfirmSupplierName = 'this supplier';
  selectedSupplierId: string | null = null;


  constructor(
    private supplierService: SupplierService,
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    this.fetchSuppliers();
  }

  fetchSuppliers() {
    const orgId = this.auth.currentUserValue?.org_id;
    if (!orgId) {
      this.errorMessage = 'Organisation not found for current user.';
      this.loading = false;
      return;
    }
    
    this.supplierService.getAllSuppliers(orgId).subscribe({
      next: (res) => {
        this.suppliers = res.suppliers || [];
        this.filteredSuppliers = [...this.suppliers];
        this.updatePaginatedSuppliers();
        this.errorMessage = ''; 
        this.loading = false;
        this.cdr.detectChanges();
        },
      error: (err) => {
        console.error('Error fetching Suppliers:', err);
        this.errorMessage = err.error?.message || 'Failed to load suppliers.';
        this.loading = false;
      },
    });
  }

  filterSuppliers() {
    const term = this.searchTerm.toLowerCase();
    this.filteredSuppliers = this.suppliers.filter((s) => {
      const name = String(s.name || '').toLowerCase();
      const company = String(s.company || '').toLowerCase();
      const email = String(s.email || '').toLowerCase();
      const phone = String(s.phone || '').toLowerCase();
      return name.includes(term) || company.includes(term) || email.includes(term) || phone.includes(term);
    });
    this.page = 1;
    this.updatePaginatedSuppliers();
  }

  updatePaginatedSuppliers() {
    const totalPages = this.totalPages();

    // Ensure page number stays valid
    if (this.page > totalPages) {
      this.page = totalPages;
    }
    if (this.page < 1) {
      this.page = 1;
    }

    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + Number(this.pageSize);
    this.paginatedSuppliers = this.filteredSuppliers.slice(startIndex, endIndex);
  }

  totalPages() {
    return Math.ceil(this.filteredSuppliers.length / this.pageSize) || 1;
  }

  onPageSizeChange() {
    this.page = 1;
    this.updatePaginatedSuppliers();
  }

  openDeleteConfirmation(supplierId: string, name:string, company:string) {
    this.selectedSupplierId = supplierId;
    this.showConfirmPopup = true;
    this.showConfirmSupplierName = name + "(" + company + ")";
  }

  deleteSupplier(supplierId: string) {
    // Call Supplier service to delete
    const orgId = this.auth.currentUserValue?.org_id||'';
    this.supplierService.deleteSupplier(orgId, supplierId).subscribe({
      next: (res) => {
        // Remove deleted product from lists
        this.suppliers = this.suppliers.filter(p => p._id !== supplierId);
        this.filterSuppliers(); // refresh filtered & paginated view
        this.showConfirmPopup = false;
        this.selectedSupplierId = null;
        this.toast.showSuccess('Supplier Deleted Successfully');
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error deleting supplier:', err);
        this.showConfirmPopup = false;
        this.selectedSupplierId = null;
        this.showConfirmSupplierName = "this supplier";
      }
    });
  }


  // Navigate to edit page
  editSupplier(id: string) {
    this.router.navigate(['/supplier/edit', id]);
  }

  navigateToCreate() {
    this.router.navigate(['/supplier/new']);
  }
}
