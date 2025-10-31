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

];