import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login.component';
import { RegisterComponent } from './auth/register.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { OrgRegisterComponent } from './org/register.component';
import { authGuard } from './auth/auth.gaurd';
import { NewProductComponent } from './pages/product/createProduct.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  
  // Organisation Paths
  { path: 'org/register', component: OrgRegisterComponent },
  
  // products routes 
  { path: 'product/new', component: NewProductComponent, canActivate: [authGuard] },

];