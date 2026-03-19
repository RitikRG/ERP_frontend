import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login.component';
import { RegisterComponent } from './auth/register.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { OrgRegisterComponent } from './org/register.component';
import { authGuard } from './auth/auth.gaurd';
import { NewProductComponent } from './pages/product/createProduct.component';
import { ProductsListComponent } from './pages/product/productList.component';
import { EditProductComponent } from './pages/product/editProduct.component';
import { NewSupplierComponent } from './pages/supplier/createSupplier.component';
import { SupplierListComponent } from './pages/supplier/suppliersList.component';
import { EditSupplierComponent } from './pages/supplier/editSupplier.component';
import { CurrentStockComponent } from './pages/inventory/currentStock.component';
import { PurchaseFormComponent } from './pages/inventory/purchase-form.component';
import { PurchaseListComponent } from './pages/inventory/purchaseList.component';
import { AddSaleComponent } from './pages/sale/add-sale.component';
import { SaleListComponent } from './pages/sale/saleList.component';
import { CustomerListComponent } from './pages/customer/customer-list.component';
import { AddCustomerComponent } from './pages/customer/add-customer.component';
import { KhataBookComponent } from './pages/customer/khatabook.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { SopSettingsComponent } from './pages/settings/sop-settings.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  
  // Organisation Paths
  { path: 'org/register', component: OrgRegisterComponent },
  
  // products routes 
  { path: 'product/new', component: NewProductComponent, canActivate: [authGuard] },
  { path: 'product/list', component: ProductsListComponent, canActivate: [authGuard] },
  { path: 'product/edit/:id', component: EditProductComponent, canActivate: [authGuard] },
  
  // Supplier paths
  { path: 'supplier/new', component: NewSupplierComponent, canActivate: [authGuard] },
  { path: 'supplier/list', component: SupplierListComponent, canActivate: [authGuard] },
  { path: 'supplier/edit/:id', component: EditSupplierComponent, canActivate: [authGuard] },
  
  // Inventory paths
  { path: 'inventory/current-stock', component: CurrentStockComponent, canActivate: [authGuard] },
  { path: 'inventory/add-purchase', component: PurchaseFormComponent, canActivate: [authGuard] },
  { path: 'inventory/list-purchase', component: PurchaseListComponent, canActivate: [authGuard] },
  
  // Sale paths
  { path: 'sales/add-sale', component: AddSaleComponent, canActivate: [authGuard] },
  { path: 'sales/list', component: SaleListComponent, canActivate: [authGuard] },
  
  // Customer Paths
  { path: 'customers/list', component: CustomerListComponent, canActivate: [authGuard] },
  { path: 'customers/new', component: AddCustomerComponent, canActivate: [authGuard] },
  { path: 'customers/dues', component: KhataBookComponent, canActivate: [authGuard] },
  
  // User Settings
  { path: 'user/settings', component: SettingsComponent, canActivate: [authGuard] },
  { path: 'settings/sop', component: SopSettingsComponent, canActivate: [authGuard] },
  
];
