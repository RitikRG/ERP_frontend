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
import { OnlineOrderListComponent } from './pages/online-orders/online-order-list.component';
import { CustomerListComponent } from './pages/customer/customer-list.component';
import { AddCustomerComponent } from './pages/customer/add-customer.component';
import { KhataBookComponent } from './pages/customer/khatabook.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { SopSettingsComponent } from './pages/settings/sop-settings.component';
import { DeliveryAgentManagementComponent } from './pages/delivery-agents/delivery-agent-management.component';
import { DeliveryOrdersComponent } from './pages/delivery/delivery-orders.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard], data: { roles: ['owner'] } },
  
  // Organisation Paths
  { path: 'org/register', component: OrgRegisterComponent },
  
  // products routes 
  { path: 'product/new', component: NewProductComponent, canActivate: [authGuard], data: { roles: ['owner'] } },
  { path: 'product/list', component: ProductsListComponent, canActivate: [authGuard], data: { roles: ['owner'] } },
  { path: 'product/edit/:id', component: EditProductComponent, canActivate: [authGuard], data: { roles: ['owner'] } },
  
  // Supplier paths
  { path: 'supplier/new', component: NewSupplierComponent, canActivate: [authGuard], data: { roles: ['owner'] } },
  { path: 'supplier/list', component: SupplierListComponent, canActivate: [authGuard], data: { roles: ['owner'] } },
  { path: 'supplier/edit/:id', component: EditSupplierComponent, canActivate: [authGuard], data: { roles: ['owner'] } },
  
  // Inventory paths
  { path: 'inventory/current-stock', component: CurrentStockComponent, canActivate: [authGuard], data: { roles: ['owner'] } },
  { path: 'inventory/add-purchase', component: PurchaseFormComponent, canActivate: [authGuard], data: { roles: ['owner'] } },
  { path: 'inventory/list-purchase', component: PurchaseListComponent, canActivate: [authGuard], data: { roles: ['owner'] } },
  
  // Sale paths
  { path: 'sales/add-sale', component: AddSaleComponent, canActivate: [authGuard], data: { roles: ['owner'] } },
  { path: 'sales/list', component: SaleListComponent, canActivate: [authGuard], data: { roles: ['owner'] } },
  { path: 'sales/online-orders', component: OnlineOrderListComponent, canActivate: [authGuard], data: { roles: ['owner'] } },
  { path: 'delivery-agents', component: DeliveryAgentManagementComponent, canActivate: [authGuard], data: { roles: ['owner'] } },
  { path: 'delivery/orders', component: DeliveryOrdersComponent, canActivate: [authGuard], data: { roles: ['delivery_agent'] } },
  
  // Customer Paths
  { path: 'customers/list', component: CustomerListComponent, canActivate: [authGuard], data: { roles: ['owner'] } },
  { path: 'customers/new', component: AddCustomerComponent, canActivate: [authGuard], data: { roles: ['owner'] } },
  { path: 'customers/dues', component: KhataBookComponent, canActivate: [authGuard], data: { roles: ['owner'] } },
  
  // User Settings
  { path: 'user/settings', component: SettingsComponent, canActivate: [authGuard], data: { roles: ['owner'] } },
  { path: 'settings/sop', component: SopSettingsComponent, canActivate: [authGuard], data: { roles: ['owner'] } },
  
];
