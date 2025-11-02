import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PurchaseService } from './purchase.service';
import { HeaderComponent } from '../../partials/header/header.component';
import { AuthService } from '../../auth/auth.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { Observable, startWith, map } from 'rxjs';
import { NgIconComponent } from '@ng-icons/core';

@Component({
  selector: 'app-purchase-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HeaderComponent,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatOptionModule,
    NgIconComponent
  ],
  templateUrl: './purchase-form.component.html',
  styleUrls: ['./inventory.css'],
})
export class PurchaseFormComponent implements OnInit {
  purchaseForm: FormGroup;
  message = '';

  suppliers: any[] = [];
  filteredSuppliers!: Observable<any[]>;

  products: any[] = [];
  filteredProducts!: Observable<any[]>;

    allProducts: any[] = [];
    productsTable: any[] = [];

    total_amount = 0;

  selectedProduct: any = null;

  constructor(
    private fb: FormBuilder,
    private purchaseService: PurchaseService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.purchaseForm = this.fb.group({
      org_id: ['', Validators.required],
      supplier_id: ['', Validators.required],
      status: ['ordered', Validators.required],
      supplier_name: [''], // search input for supplier
      date: [new Date().toISOString().substring(0, 10), Validators.required],
      payment_status: ['unpaid', Validators.required],
      payment_due_date: [''],
      paid_amount: [''],
      total_amount: [0, Validators.required],
      items: this.fb.array([]),
      product_name: [''] // for product search
    });
  }

  ngOnInit() {
    const org_id = this.auth.currentUserValue?.org_id || '';
    this.purchaseForm.patchValue({ org_id });

    // Fetch suppliers
    this.purchaseService.getAllSuppliers(org_id).subscribe({
      next: (res: any) => {
        this.suppliers = res?.suppliers || res || [];
        this.setupSupplierFilter();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error fetching suppliers:', err)
    });

    // Fetch products
    this.purchaseService.getAllProducts(org_id).subscribe({
      next: (res: any) => {
        this.allProducts  = res?.products || res || [];
        this.products = [...this.allProducts];
        this.setupProductFilter();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error fetching products:', err)
    });

    this.purchaseForm.get('payment_status')?.valueChanges.subscribe(status => {
        const dueDateControl = this.purchaseForm.get('payment_due_date');
        const amountPaidControl = this.purchaseForm.get('paid_amount');

        if (status === 'paid') {
            // hide due date, clear and disable it
            dueDateControl?.setValue('');
            dueDateControl?.disable();

            // hide amount paid if needed
            amountPaidControl?.setValue('');
            amountPaidControl?.disable();
        } else if (status === 'partial') {
            // show amount paid, enable it, and make it required
            amountPaidControl?.enable();
            amountPaidControl?.setValidators([Validators.required, Validators.min(1)]);
            amountPaidControl?.updateValueAndValidity();

            // enable due date
            dueDateControl?.enable();
        } else {
            // unpaid
            dueDateControl?.enable();
            amountPaidControl?.setValue('');
            amountPaidControl?.clearValidators();
            amountPaidControl?.disable();
        }
        });

  }

  // ---------- SUPPLIER FILTER ----------
  setupSupplierFilter() {
    this.filteredSuppliers = this.purchaseForm.get('supplier_name')!.valueChanges.pipe(
      startWith(''),
      map(value => this.filterSuppliers(value || ''))
    );
  }

  filterSuppliers(value: String) {
    const filterValue = String(value).toLowerCase();
    return this.suppliers.filter(s => {
        const name = String(s.name)?.toLowerCase() || '';
        const company = String(s.company)?.toLowerCase() || '';
        return name.includes(filterValue) || company.includes(filterValue);
    });
  }

  selectSupplier(supplier: any) {
    this.purchaseForm.patchValue({
      supplier_id: supplier._id,
      supplier_name: supplier.name,
      supplier_company: supplier.company
    });
  }

  // ---------- PRODUCT FILTER ----------
  setupProductFilter() {
    this.filteredProducts = this.purchaseForm.get('product_name')!.valueChanges.pipe(
      startWith(''),
      map(value => this.filterProducts(value || ''))
    );
  }

  filterProducts(value: String) {
    const filterValue = String(value).toLowerCase();
    return this.allProducts.filter(p => {
        const name = String(p.name)?.toLowerCase() || '';
        const code = String(p.p_code)?.toLowerCase() || '';
        return name.includes(filterValue) || code.includes(filterValue);
    });
  }

    selectProduct(product: any) {
        if (!product) return;

        // Check if product already exists in table
        const exists = this.productsTable.some(p => p._id === product._id);
        if (exists) {
            this.purchaseForm.patchValue({ product_name: '' });
            return; // Prevent duplicates (optional)
        }

        // Add new row in form array
        const newItem = this.fb.group({
            product_id: [product._id, Validators.required],
            cost: [product.cost || 0, Validators.required],
            quantity: [1, Validators.required]
        });
        this.items.push(newItem);

        // Add to display table
        this.productsTable.push(product);

        // Reset input for next selection
        this.purchaseForm.patchValue({ product_name: '' });
        this.selectedProduct = null;
        this.cdr.detectChanges();
    }



  // ---------- FORM HELPERS ----------
  get items() {
    return this.purchaseForm.get('items') as FormArray;
  }

  createItem(): FormGroup {
    return this.fb.group({
      product_id: ['', Validators.required],
      cost: [0, Validators.required],
      quantity: [1, Validators.required]
    });
  }

  addItem() { this.items.push(this.createItem()); }
  removeItem(i: number) { this.items.removeAt(i); }

  // ---------- SUBMIT ----------
  submit() {
    if (this.purchaseForm.invalid) return;
    this.purchaseService.createPurchase(this.purchaseForm.value).subscribe({
      next: () => this.message = 'Purchase created successfully!',
      error: (err) => this.message = 'Error: ' + err.message
    });
  }

  getItemGroup(i: number): FormGroup {
    return this.items.at(i) as FormGroup;
    }

  getTotal() {
    if (!this.selectedProduct) return 0;
    const qty = this.items.at(0)?.get('quantity')?.value || 1;
    const price = this.selectedProduct.unit_price || 0;
    return qty * price;
  }

  removeProduct(index: number) {
    this.items.removeAt(index);
    this.productsTable.splice(index, 1);
    }

    getTableTotals() {
        let totalQty = 0;
        let totalAmount = 0;

        this.items.controls.forEach((ctrl, i) => {
            const qty = Number(ctrl.get('quantity')?.value || 0);
            const cost = Number(this.productsTable[i]?.cost || 0);
            totalQty += qty;
            totalAmount += qty * cost;
        });

        this.total_amount = totalAmount;
        this.purchaseForm.patchValue({ total_amount: this.total_amount });
        return { totalQty, totalAmount };
    }

}
