import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';

interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
  isOpen?: boolean;
}

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  imports: [CommonModule, FormsModule],
})
export class HeaderComponent {
  sidebarOpen = true;

  menuItems: MenuItem[] = [
    { label: 'Dashboard', icon: 'fa fa-home', route: '/dashboard' },
    {
      label: 'Sales', icon: 'fa fa-box', route: 'javascript:void(0)', children: [
        { label: 'Add Sale', icon: 'fa fa-plus', route: '/sales/add-sale' },
        { label: 'Sales List', icon: 'fa fa-plus', route: '/sales/list' },
      ]
    },
    {
      label: 'Inventory', icon: 'fa fa-box', route: 'javascript:void(0)', children: [
        { label: 'Current Stock', icon: 'fa fa-plus', route: '/inventory/current-stock' },
        { label: 'Add Purchase', icon: 'fa fa-plus', route: '/inventory/add-purchase' },
        { label: 'Purchase List', icon: 'fa fa-list', route: '/inventory/list-purchase' },
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
    {
      label: 'Customers', icon: 'fa fa-box', route: 'javascript:void(0)', children: [
        { label: 'Add Customer', icon: 'fa fa-plus', route: '/customers/new' },
        { label: 'Customers List', icon: 'fa fa-plus', route: '/customers/list' },
        { label: 'Khatabook', icon: 'fa fa-plus', route: '/customers/dues' },
      ]
    },
    { label: 'Share', icon: 'fa fa-share-alt', route: '#' }
  ];

  searchText: string = '';
  filteredResults: any[] = [];
  showSearchResults = false;
  activeIndex = 0;

  showUserDropdown = false;

  user: any = {
    name: 'User',
    company: 'Company'
  };
  
  
  
  constructor(private router: Router, private auth: AuthService, private cdr: ChangeDetectorRef) {
    this.menuItems.forEach(item => {
      if (item.children) {
        item.isOpen = item.children.some(child => this.router.url.startsWith(child.route || ''));
      }
    });
  }
  
  ngOnInit() {
    const u = this.auth.currentUserValue;

    this.user = {
      name: u?.name || "User",
      company: u?.org?.name || "Company"
    };

    document.addEventListener("click", () => {
      this.showUserDropdown = false;
    });
  }


  toggleUserMenu() {
    this.showUserDropdown = !this.showUserDropdown;
    this.cdr.detectChanges();
  }

  navigateToSettings() {
    this.showUserDropdown = false;
    this.router.navigate(['/user/settings']);
  }

  logout() {
    this.showUserDropdown = false;
    this.auth.logout();
    this.router.navigate(['/login']);
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

  onSearchChange() {
    const term = this.searchText.toLowerCase().trim();

    if (!term) {
      this.showSearchResults = false;
      return;
    }

    // Flatten menu
    const allItems: any[] = [];

    this.menuItems.forEach(parent => {
      if (parent.children) {
        parent.children.forEach(child => {
          allItems.push({
            label: child.label,
            icon: child.icon,
            route: child.route,
            parent: parent.label
          });
        });
      } else {
        allItems.push({
          label: parent.label,
          icon: parent.icon,
          route: parent.route,
          parent: ''
        });
      }
    });

    // Filter
    this.filteredResults = allItems.filter(item =>
      item.label.toLowerCase().includes(term)
    );

    this.showSearchResults = this.filteredResults.length > 0;
    this.activeIndex = 0;
  }

  navigateTo(route: string) {
    this.searchText = '';
    this.showSearchResults = false;
    this.router.navigate([route]);
  }

  moveActive(direction: number) {
    if (!this.showSearchResults) return;

    this.activeIndex += direction;

    if (this.activeIndex < 0) this.activeIndex = this.filteredResults.length - 1;
    if (this.activeIndex >= this.filteredResults.length) this.activeIndex = 0;
  }

  selectActive() {
    if (!this.showSearchResults) return;
    const item = this.filteredResults[this.activeIndex];
    if (item) this.navigateTo(item.route);
  }

}
