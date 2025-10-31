import { Component, OnInit, ChangeDetectorRef  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProductService } from './product.service';
import { AuthService } from '../../auth/auth.service';
import { HeaderComponent } from '../../partials/header/header.component';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { ToastService } from '../../services/toast.service';
import { BarcodeScannerComponent } from '../../partials/barcode/barcode-scanner.component';


@Component({
  selector: 'product-list',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FormsModule, FontAwesomeModule, BarcodeScannerComponent],
  templateUrl: './currentStock.component.html',
  styleUrls: ['./inventory.css'],
})
export class CurrentStockComponent implements OnInit {
  // icons
  faEdit = faEdit;
  faTrash = faTrash;

  products: any[] = [];
  filteredProducts: any[] = [];
  loading = true;
  errorMessage = '';
  searchTerm = '';

  // Pagination
  page = 1;
  pageSize = 10;  
  pageSizes = [5,10, 25, 50];
  paginatedProducts: any[] = [];

  // alert quantity placeholder, in future this will use a dynamic value based on user settings
  alertQuantity = 10;

  // Confirmation popup
  showConfirmPopup = false;
  showConfirmProductName = 'this product';
  selectedProductId: string | null = null;


  constructor(
    private productService: ProductService,
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    this.fetchProducts();
  }

  fetchProducts() {
    const orgId = this.auth.currentUserValue?.org_id;
    if (!orgId) {
      this.errorMessage = 'Organisation not found for current user.';
      this.loading = false;
      return;
    }
    
    this.productService.getAllProducts(orgId).subscribe({
      next: (res) => {
        this.products = res.products || [];
        this.filteredProducts = [...this.products];
        this.updatePaginatedProducts();
        this.errorMessage = ''; 
        this.loading = false;
        this.cdr.detectChanges();
        },
      error: (err) => {
        console.error('Error fetching products:', err);
        this.errorMessage = err.error?.message || 'Failed to load products.';
        this.loading = false;
      },
    });
  }

  filterProducts() {
    const term = this.searchTerm.toLowerCase();
    this.filteredProducts = this.products.filter((p) => {
      const name = String(p.name || '').toLowerCase();
      const code = String(p.p_code || '').toLowerCase();
      return name.includes(term) || code.includes(term);
    });
    this.page = 1;
    this.updatePaginatedProducts();
  }

  updatePaginatedProducts() {
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
    this.paginatedProducts = this.filteredProducts.slice(startIndex, endIndex);
  }

  totalPages() {
    return Math.ceil(this.filteredProducts.length / this.pageSize) || 1;
  }

  onPageSizeChange() {
    this.page = 1;
    this.updatePaginatedProducts();
  }

  openDeleteConfirmation(productId: string, name:string, code:string) {
    this.selectedProductId = productId;
    this.showConfirmPopup = true;
    this.showConfirmProductName = name + "(" + code + ")";
  }

  deleteProduct(productId: string) {
    // Call ProductService to delete
    const orgId = this.auth.currentUserValue?.org_id||'';
    this.productService.deleteProduct(orgId, productId).subscribe({
      next: (res) => {
        // Remove deleted product from lists
        this.products = this.products.filter(p => p._id !== productId);
        this.filterProducts(); // refresh filtered & paginated view
        this.showConfirmPopup = false;
        this.selectedProductId = null;
        this.toast.showSuccess('Product Deleted Successfully');
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error deleting product:', err);
        this.showConfirmPopup = false;
        this.selectedProductId = null;
        this.showConfirmProductName = "this product";
      }
    });
  }


  // Navigate to edit page
  editProduct(id: string) {
    this.router.navigate(['/product/edit', id]);
  }

  // Barcode scanned handler
  onBarcodeScanned(barcode: string) {
    this.searchTerm= barcode;
    this.filterProducts();
  }

  navigateToCreate() {
    this.router.navigate(['/product/new']);
  }
}
