import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { HeaderComponent } from '../../partials/header/header.component';
import { AuthService } from '../../auth/auth.service';
import { SaleService } from './sale.service';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';

import { Observable, startWith, map } from 'rxjs';
import { NgIconComponent } from '@ng-icons/core';
import { ToastService } from '../../services/toast.service';

declare var Razorpay: any;

@Component({
  selector: 'app-sale-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HeaderComponent,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatOptionModule,
    NgIconComponent,
    CurrencyPipe
  ],
  templateUrl: './add-sale.component.html',
  styleUrls: ['./sale.css']
})
export class AddSaleComponent implements OnInit {

  saleForm: FormGroup;

  customers: any[] = [];
  filteredCustomers!: Observable<any[]>;

  products: any[] = [];
  filteredProducts!: Observable<any[]>;

  productsTable: any[] = [];
  allProducts: any[] = [];

  total_amount = 0;
  selectedProduct: any = null;

  constructor(
    private fb: FormBuilder,
    private saleService: SaleService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService,
    private router: Router,
  ) {

    this.saleForm = this.fb.group({
      org_id: ['', Validators.required],
      customer_id: [''],

      customer_name: [''],

      date: [new Date().toISOString().substring(0, 10), Validators.required],
      payment_status: ['unpaid', Validators.required],

      payment_method: ['cash'],
      transaction_id: [''],
      cheque_no: [''],

      paid_amount: [''],
      payment_due_date: [''],
      payment_date: [new Date().toISOString().substring(0, 10)],

      total_amount: [0, Validators.required],

      items: this.fb.array([]),

      product_name: [''],

      discount_type: ['none'],
      discount_value: [0],
      final_amount: [0, Validators.required],
    });
  }

  ngOnInit() {
    const org_id = this.auth.currentUserValue?.org_id || '';
    this.saleForm.patchValue({ org_id });

    this.saleService.getAllCustomers(org_id).subscribe({
      next: (res: any) => {
        this.customers = res.customers || [];
        this.setupCustomerFilter();
        this.cdr.detectChanges();
      }
    });

    this.saleService.getAllProducts(org_id).subscribe({
      next: (res: any) => {
        this.allProducts = res.products || [];
        this.products = [...this.allProducts];
        this.setupProductFilter();
        this.cdr.detectChanges();
      }
    });

    this.saleForm.get('payment_status')?.valueChanges.subscribe(status => {
      const paidCtrl = this.saleForm.get('paid_amount');
      const dueCtrl = this.saleForm.get('payment_due_date');

      if (status === 'paid') {
        paidCtrl?.setValue('');
        paidCtrl?.disable();
        dueCtrl?.setValue('');
        dueCtrl?.disable();
      } else if (status === 'partial') {
        paidCtrl?.enable();
        paidCtrl?.setValidators([Validators.required, Validators.min(1)]);
        dueCtrl?.enable();
      } else {
        paidCtrl?.setValue('');
        paidCtrl?.disable();
        dueCtrl?.enable();
      }
    });
  }

  setupCustomerFilter() {
    this.filteredCustomers = this.saleForm.get('customer_name')!.valueChanges.pipe(
      startWith(''),
      map(val => this.filterCustomers(val || ''))
    );
  }

  filterCustomers(value: string) {
    const filter = String(value).toLowerCase();
    return this.customers.filter(c =>
      String(c.name || '').toLowerCase().includes(filter) ||
      String(c.mobile_number || '').includes(filter)
    );
  }

  selectCustomer(customer: any) {
    this.saleForm.patchValue({
      customer_id: customer._id,
      customer_name: customer
    });
  }

  displayCustomer(c: any): string {
    return c ? `${c.name || 'N/A'} (${c.mobile_number})` : '';
  }

  setupProductFilter() {
    this.filteredProducts = this.saleForm.get('product_name')!.valueChanges.pipe(
      startWith(''),
      map(val => this.filterProducts(val || ''))
    );
  }

  filterProducts(value: string) {
    const filter = String(value).toLowerCase();
    return this.allProducts.filter(p =>
      String(p.name).toLowerCase().includes(filter) ||
      String(p.p_code).toLowerCase().includes(filter)
    );
  }

  selectProduct(product: any) {
    if (!product) return;

    const exists = this.productsTable.some(p => p._id === product._id);
    if (exists) {
      this.saleForm.patchValue({ product_name: '' });
      return;
    }

    const newItem = this.fb.group({
      product_id: [product._id, Validators.required],
      price: [product.price || 0, Validators.required],
      quantity: [1, Validators.required]
    });

    this.items.push(newItem);
    this.productsTable.push(product);

    this.saleForm.patchValue({ product_name: '' });
    this.selectedProduct = null;

    this.cdr.detectChanges();
  }

  get items() {
    return this.saleForm.get('items') as FormArray;
  }

  removeProduct(index: number) {
    this.items.removeAt(index);
    this.productsTable.splice(index, 1);
    this.calculateTotal();
  }

  calculateTotal() {
    let total = 0;
    let totalQty = 0;

    this.items.controls.forEach((ctrl, i) => {
      const qty = Number(ctrl.get('quantity')?.value || 0);
      const price = Number(this.productsTable[i]?.price || 0);

      totalQty += qty;
      total += qty * price;
    });

    this.total_amount = total;

    let discount = 0;
    const type = this.saleForm.get('discount_type')?.value;
    const val = Number(this.saleForm.get('discount_value')?.value || 0);

    if (type === 'percent') {
      discount = (total * val) / 100;
    }

    if (type === 'fixed') {
      discount = val;
    }

    const final = Math.max(0, total - discount);

    this.saleForm.patchValue({
      total_amount: total,
      final_amount: final
    });

    return { totalQty, total, discount, final };
  }

  getItemGroup(i: number): FormGroup {
    return this.items.at(i) as FormGroup;
  }

  getSelectedCustomerMobile() {
    const c = this.saleForm.get('customer_name')?.value;
    return c?.mobile_number || "";
  }

  collectPayment() {
    const razorpayKey = this.auth.currentUserValue?.org?.razorpay_key || "";
    const paymentStatus = this.saleForm.get('payment_status')?.value;
    const paidAmount = Number(this.saleForm.get('paid_amount')?.value || 0);
    const finalAmount = this.calculateTotal().final;

    let amountToPay = finalAmount;

    if (paymentStatus === 'partial') {
      if (!paidAmount || paidAmount <= 0) {
        this.toast.showError("Enter a valid partial paid amount.");
        return;
      }
      amountToPay = paidAmount;
    }

    if (!amountToPay || amountToPay <= 0) {
      this.toast.showError("Payment amount is invalid.");
      return;
    }

    if (!razorpayKey) {
      this.toast.showError("Razorpay key is not configured for this organisation.");
      return;
    }

    const options = {
      key: razorpayKey,
      amount: Math.round(amountToPay * 100),
      currency: "INR",
      name: this.auth.currentUserValue?.org?.name || "Your Business Name",
      description: "Sale Payment",
      theme: { color: "#3f51b5" },

      handler: (response: any) => {
        console.log("Payment success:", response);

        this.saleForm.patchValue({
          transaction_id: response.razorpay_payment_id,
          payment_method: "upi",
        });

        if (paymentStatus === "paid") {
          this.saleForm.patchValue({ paid_amount: finalAmount });
        }

        if (paymentStatus === "partial") {
          this.saleForm.patchValue({ paid_amount: paidAmount });
        }

        this.toast.showSuccess("Payment collected successfully!");
      },

      modal: {
        ondismiss: () => {
          this.toast.showInfo("Payment popup closed.");
        }
      },

      prefill: {
        name: this.saleForm.get('customer_name')?.value?.name || "",
        contact: this.saleForm.get('customer_name')?.value?.mobile_number || "",
      },

      method: {
        upi: true,
        card: false,
        netbanking: false,
        wallet: false
      }
    };

    const rzp = new Razorpay(options);
    rzp.open();
  }

  submit() {
    if (this.saleForm.invalid) return;
    this.saleService.addSale(this.saleForm.value).subscribe({
      next: () => {
        this.toast.showSuccess('Sale added successfully!');
        setTimeout(() => this.router.navigate(['/sales/list']), 500);
      },
      error: err => {
        this.toast.showError(err.error?.message || 'Error adding sale');
      }
    });
  }
}
