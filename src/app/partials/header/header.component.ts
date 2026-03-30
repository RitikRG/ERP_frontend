import { ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
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
export class HeaderComponent implements OnInit, OnDestroy {
  sidebarOpen = true;
  isCompactViewport = false;

  menuItems: MenuItem[] = [];

  searchText: string = '';
  filteredResults: any[] = [];
  showSearchResults = false;
  activeIndex = 0;

  showUserDropdown = false;
  canOpenSettings = false;

  user: any = {
    name: 'User',
    company: 'Company',
  };

  private readonly documentClickHandler = () => {
    if (this.showUserDropdown) {
      this.showUserDropdown = false;
      this.cdr.detectChanges();
    }
  };

  constructor(
    private router: Router,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
  ) {
    this.menuItems = this.buildMenuForRole(this.auth.currentUserValue?.type);
    this.syncOpenMenus();
  }

  ngOnInit() {
    this.syncViewportState(true);

    const u = this.auth.currentUserValue;

    this.user = {
      name: u?.name || 'User',
      company: u?.org?.name || 'Company',
    };
    this.canOpenSettings = this.auth.hasRole('owner');
    this.menuItems = this.buildMenuForRole(u?.type);
    this.syncOpenMenus();

    document.addEventListener('click', this.documentClickHandler);
  }

  private buildMenuForRole(role: string | undefined): MenuItem[] {
    if (role === 'delivery_agent') {
      return [
        {
          label: 'Deliveries',
          icon: 'fa fa-truck',
          route: 'javascript:void(0)',
          children: [
            { label: 'Assigned Orders', icon: 'fa fa-list', route: '/delivery/orders' },
          ],
        },
      ];
    }

    return [
      { label: 'Dashboard', icon: 'fa fa-home', route: '/dashboard' },
      {
        label: 'Sales',
        icon: 'fa fa-box',
        route: 'javascript:void(0)',
        children: [
          { label: 'Add Sale', icon: 'fa fa-plus', route: '/sales/add-sale' },
          { label: 'Sales List', icon: 'fa fa-plus', route: '/sales/list' },
          { label: 'Online Orders', icon: 'fa fa-list', route: '/sales/online-orders' },
          { label: 'Delivery Agents', icon: 'fa fa-truck', route: '/delivery-agents' },
        ],
      },
      {
        label: 'Inventory',
        icon: 'fa fa-box',
        route: 'javascript:void(0)',
        children: [
          { label: 'Current Stock', icon: 'fa fa-plus', route: '/inventory/current-stock' },
          { label: 'Add Purchase', icon: 'fa fa-plus', route: '/inventory/add-purchase' },
          { label: 'Purchase List', icon: 'fa fa-list', route: '/inventory/list-purchase' },
        ],
      },
      {
        label: 'Products',
        icon: 'fa fa-box',
        route: 'javascript:void(0)',
        children: [
          { label: 'Add Product', icon: 'fa fa-plus', route: '/product/new' },
          { label: 'Product List', icon: 'fa fa-list', route: '/product/list' },
        ],
      },
      {
        label: 'Supplier',
        icon: 'fa fa-box',
        route: 'javascript:void(0)',
        children: [
          { label: 'Add Supplier', icon: 'fa fa-plus', route: '/supplier/new' },
          { label: 'Suppliers List', icon: 'fa fa-plus', route: '/supplier/list' },
        ],
      },
      {
        label: 'Customers',
        icon: 'fa fa-box',
        route: 'javascript:void(0)',
        children: [
          { label: 'Add Customer', icon: 'fa fa-plus', route: '/customers/new' },
          { label: 'Customers List', icon: 'fa fa-plus', route: '/customers/list' },
          { label: 'Khatabook', icon: 'fa fa-plus', route: '/customers/dues' },
        ],
      },
      {
        label: 'Settings',
        icon: 'fa fa-box',
        route: 'javascript:void(0)',
        children: [
          { label: 'User Settings', icon: 'fa fa-plus', route: '/user/settings' },
          { label: 'SOP Settings', icon: 'fa fa-plus', route: '/settings/sop' },
        ],
      },
    ];
  }

  private syncOpenMenus() {
    this.menuItems.forEach((item) => {
      if (item.children) {
        item.isOpen = item.children.some((child) => this.router.url.startsWith(child.route || ''));
      }
    });
  }

  ngOnDestroy() {
    document.removeEventListener('click', this.documentClickHandler);
  }

  @HostListener('window:resize')
  onWindowResize() {
    this.syncViewportState();
  }

  private syncViewportState(force = false) {
    const compactViewport = window.innerWidth <= 1024;
    const changed = compactViewport !== this.isCompactViewport;

    this.isCompactViewport = compactViewport;

    if (force || changed) {
      this.sidebarOpen = !compactViewport;
      this.cdr.detectChanges();
    }
  }

  toggleUserMenu() {
    this.showUserDropdown = !this.showUserDropdown;
    this.cdr.detectChanges();
  }

  navigateToSettings() {
    this.showUserDropdown = false;
    this.router.navigate(['/user/settings']);
    this.closeSidebarOnCompactViewport();
  }

  logout() {
    this.showUserDropdown = false;
    this.auth.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
    this.cdr.detectChanges();
  }

  toggleSubMenu(item: MenuItem) {
    item.isOpen = !item.isOpen;
    this.cdr.detectChanges();
  }

  handleMenuClick(item: MenuItem, event: Event) {
    event.preventDefault();

    if (item.children?.length) {
      this.toggleSubMenu(item);
      return;
    }

    if (item.route && item.route !== '#' && item.route !== 'javascript:void(0)') {
      this.navigateTo(item.route);
    }
  }

  handleChildClick(route: string | undefined, event: Event) {
    event.preventDefault();

    if (route) {
      this.navigateTo(route);
    }
  }

  closeSidebarOnCompactViewport() {
    if (this.isCompactViewport && this.sidebarOpen) {
      this.sidebarOpen = false;
      this.cdr.detectChanges();
    }
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

    this.menuItems.forEach((parent) => {
      if (parent.children) {
        parent.children.forEach((child) => {
          allItems.push({
            label: child.label,
            icon: child.icon,
            route: child.route,
            parent: parent.label,
          });
        });
      } else {
        allItems.push({
          label: parent.label,
          icon: parent.icon,
          route: parent.route,
          parent: '',
        });
      }
    });

    // Filter
    this.filteredResults = allItems.filter((item) => item.label.toLowerCase().includes(term));

    this.showSearchResults = this.filteredResults.length > 0;
    this.activeIndex = 0;
  }

  navigateTo(route: string) {
    this.searchText = '';
    this.showSearchResults = false;
    this.router.navigate([route]);
    this.closeSidebarOnCompactViewport();
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
