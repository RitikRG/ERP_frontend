import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
  isOpen?: boolean;
}

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  imports: [CommonModule],
})
export class HeaderComponent {
  sidebarOpen = true;

  menuItems: MenuItem[] = [
    { label: 'Dashboard', icon: 'fa fa-home', route: '#' },
    {
      label: 'Inventory', icon: 'fa fa-box', route: 'javascript:void(0)', children: [
        { label: 'Current Stock', icon: 'fa fa-plus', route: '/inventory/current-stock' },
      ]
    },
    {
      label: 'Products', icon: 'fa fa-box', route: 'javascript:void(0)', children: [
        { label: 'Add Product', icon: 'fa fa-plus', route: '/product/new' },
        { label: 'Product List', icon: 'fa fa-list', route: '/product/list' }
      ]
    },
    {
      label: 'Supplier', icon: 'fa fa-box', route: 'javascript:void(0)', children: [
        { label: 'Add Supplier', icon: 'fa fa-plus', route: '/supplier/new' },
        { label: 'Suppliers List', icon: 'fa fa-plus', route: '/supplier/list' }
      ]
    },
    { label: 'Billing', icon: 'fa fa-file-invoice', route: '#' },
    { label: 'Share', icon: 'fa fa-share-alt', route: '#' }
  ];

  constructor(private router: Router) {
    this.menuItems.forEach(item => {
      if (item.children) {
        item.isOpen = item.children.some(child => this.router.url.startsWith(child.route || ''));
      }
    });
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  toggleSubMenu(item: MenuItem) {
    item.isOpen = !item.isOpen;
  }

  isChildActive(childRoute: string | undefined): boolean {
    return childRoute ? this.router.url.startsWith(childRoute) : false;
  }
}
