import { ChangeDetectorRef, Component, HostListener, NgZone, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../auth/auth.service';
import { NotificationService } from '../../services/notification.service';
import { NotificationItem } from '../../core/models/notification';

interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
  isOpen?: boolean;
}

interface QuickLink {
  label: string;
  icon: string;
  route: string;
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
  isMobileViewport = false;
  hasScrolled = false;
  mobileSearchExpanded = false;

  menuItems: MenuItem[] = [];
  mobileShortcuts: QuickLink[] = [];

  searchText = '';
  filteredResults: Array<{ label: string; icon: string; route: string; parent: string }> = [];
  showSearchResults = false;
  activeIndex = 0;

  showUserDropdown = false;
  showNotificationDropdown = false;
  canOpenSettings = false;

  unreadCount = 0;
  notifications: NotificationItem[] = [];

  currentSection = 'Dashboard';
  currentSectionGroup = 'Business Suite';

  canInstall = false;
  private installPrompt: any = null;
  private readonly subscriptions = new Subscription();

  private readonly installPromptHandler = (e: Event) => {
    e.preventDefault();
    this.installPrompt = e;
    this.ngZone.run(() => {
      this.canInstall = true;
      this.cdr.detectChanges();
    });
  };

  private readonly appInstalledHandler = () => {
    this.ngZone.run(() => {
      this.canInstall = false;
      this.installPrompt = null;
      this.cdr.detectChanges();
    });
  };

  user: { name: string; company: string } = {
    name: 'User',
    company: 'Company',
  };

  private readonly documentClickHandler = () => {
    let changed = false;

    if (this.showUserDropdown) {
      this.showUserDropdown = false;
      changed = true;
    }

    if (this.showNotificationDropdown) {
      this.showNotificationDropdown = false;
      changed = true;
    }

    if (this.mobileSearchExpanded) {
      this.mobileSearchExpanded = false;
      this.showSearchResults = false;
      changed = true;
    }

    if (changed) {
      this.cdr.detectChanges();
    }
  };

  constructor(
    private router: Router,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService,
    private ngZone: NgZone
  ) {
    this.configureNavigation(this.auth.currentUserValue?.type);
  }

  ngOnInit() {
    this.syncViewportState(true);

    const currentUser = this.auth.currentUserValue;

    this.user = {
      name: currentUser?.name || 'User',
      company: currentUser?.org?.name || 'Company',
    };

    this.canOpenSettings = this.auth.hasRole('owner');
    this.configureNavigation(currentUser?.type);

    document.addEventListener('click', this.documentClickHandler);
    window.addEventListener('beforeinstallprompt', this.installPromptHandler);
    window.addEventListener('appinstalled', this.appInstalledHandler);

    this.subscriptions.add(
      this.notificationService.unreadCount$.subscribe((count) => {
        this.unreadCount = count;
        this.cdr.detectChanges();
      })
    );

    this.subscriptions.add(
      this.notificationService.notifications$.subscribe((notifications) => {
        this.notifications = notifications.slice(0, 5);
        this.cdr.detectChanges();
      })
    );

    this.subscriptions.add(
      this.router.events
        .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
        .subscribe(() => {
          this.syncOpenMenus();
          this.updateCurrentSection();
          this.cdr.detectChanges();
        })
    );

    if (currentUser) {
      this.notificationService.requestPermissionAndSubscribe();
      this.subscriptions.add(this.notificationService.fetchNotifications(1, 10).subscribe());
    }
  }

  ngOnDestroy() {
    document.removeEventListener('click', this.documentClickHandler);
    window.removeEventListener('beforeinstallprompt', this.installPromptHandler);
    window.removeEventListener('appinstalled', this.appInstalledHandler);
    this.subscriptions.unsubscribe();
  }

  get userInitials(): string {
    return this.user.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'U';
  }

  private configureNavigation(role: string | undefined) {
    this.menuItems = this.buildMenuForRole(role);
    this.mobileShortcuts = this.buildShortcutsForRole(role);
    this.syncOpenMenus();
    this.updateCurrentSection();
  }

  private buildMenuForRole(role: string | undefined): MenuItem[] {
    if (role === 'delivery_agent') {
      return [
        {
          label: 'Deliveries',
          icon: 'local_shipping',
          route: 'javascript:void(0)',
          children: [{ label: 'Assigned Orders', icon: 'assignment', route: '/delivery/orders' }],
        },
      ];
    }

    return [
      { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
      {
        label: 'Sales',
        icon: 'point_of_sale',
        route: 'javascript:void(0)',
        children: [
          { label: 'Add Sale', icon: 'add_circle', route: '/sales/add-sale' },
          { label: 'Sales List', icon: 'receipt_long', route: '/sales/list' },
          { label: 'Online Orders', icon: 'shopping_cart', route: '/sales/online-orders' },
          { label: 'Delivery Agents', icon: 'local_shipping', route: '/delivery-agents' },
        ],
      },
      {
        label: 'Inventory',
        icon: 'inventory_2',
        route: 'javascript:void(0)',
        children: [
          { label: 'Current Stock', icon: 'inventory', route: '/inventory/current-stock' },
          { label: 'Add Purchase', icon: 'shopping_bag', route: '/inventory/add-purchase' },
          { label: 'Purchase List', icon: 'list_alt', route: '/inventory/list-purchase' },
        ],
      },
      {
        label: 'Products',
        icon: 'category',
        route: 'javascript:void(0)',
        children: [
          { label: 'Add Product', icon: 'add_box', route: '/product/new' },
          { label: 'Product List', icon: 'format_list_bulleted', route: '/product/list' },
        ],
      },
      {
        label: 'Supplier',
        icon: 'handshake',
        route: 'javascript:void(0)',
        children: [
          { label: 'Add Supplier', icon: 'person_add', route: '/supplier/new' },
          { label: 'Suppliers List', icon: 'group', route: '/supplier/list' },
        ],
      },
      {
        label: 'Customers',
        icon: 'groups',
        route: 'javascript:void(0)',
        children: [
          { label: 'Add Customer', icon: 'person_add_alt', route: '/customers/new' },
          { label: 'Customers List', icon: 'contact_page', route: '/customers/list' },
          { label: 'Khatabook', icon: 'menu_book', route: '/customers/dues' },
        ],
      },
      {
        label: 'Settings',
        icon: 'settings',
        route: 'javascript:void(0)',
        children: [
          { label: 'User Settings', icon: 'manage_accounts', route: '/user/settings' },
          { label: 'SOP Settings', icon: 'tune', route: '/settings/sop' },
        ],
      },
    ];
  }

  private buildShortcutsForRole(role: string | undefined): QuickLink[] {
    if (role === 'delivery_agent') {
      return [{ label: 'Orders', icon: 'assignment', route: '/delivery/orders' }];
    }

    return [
      { label: 'Home', icon: 'dashboard', route: '/dashboard' },
      { label: 'Stock', icon: 'inventory_2', route: '/inventory/current-stock' },
      { label: 'Sales', icon: 'point_of_sale', route: '/sales/list' },
      { label: 'Customers', icon: 'groups', route: '/customers/list' },
    ];
  }

  private syncOpenMenus() {
    this.menuItems.forEach((item) => {
      if (item.children?.length) {
        item.isOpen = item.children.some((child) => this.router.url.startsWith(child.route || ''));
      }
    });
  }

  private updateCurrentSection() {
    for (const item of this.menuItems) {
      if (item.children?.length) {
        const activeChild = item.children.find((child) => this.router.url.startsWith(child.route || ''));
        if (activeChild) {
          this.currentSection = activeChild.label;
          this.currentSectionGroup = item.label;
          return;
        }
      }

      if (item.route && item.route !== 'javascript:void(0)' && this.router.url.startsWith(item.route)) {
        this.currentSection = item.label;
        this.currentSectionGroup = this.user.company || 'Business Suite';
        return;
      }
    }

    this.currentSection = 'Workspace';
    this.currentSectionGroup = this.user.company || 'Business Suite';
  }

  @HostListener('window:resize')
  onWindowResize() {
    this.syncViewportState();
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    const nextScrolled = window.scrollY > 8;

    if (nextScrolled !== this.hasScrolled) {
      this.hasScrolled = nextScrolled;

      if (!nextScrolled && this.mobileSearchExpanded) {
        this.mobileSearchExpanded = false;
        this.showSearchResults = false;
      }

      this.cdr.detectChanges();
    }
  }

  private syncViewportState(force = false) {
    const compactViewport = window.innerWidth <= 1024;
    const mobileViewport = window.innerWidth <= 640;
    const changed = compactViewport !== this.isCompactViewport;

    this.isCompactViewport = compactViewport;
    this.isMobileViewport = mobileViewport;

    if (!mobileViewport && this.mobileSearchExpanded) {
      this.mobileSearchExpanded = false;
      this.showSearchResults = false;
    }

    if (force || changed) {
      this.sidebarOpen = !compactViewport;
      this.cdr.detectChanges();
    }
  }

  async installApp() {
    if (!this.installPrompt) {
      return;
    }

    this.installPrompt.prompt();
    const { outcome } = await this.installPrompt.userChoice;

    if (outcome === 'accepted') {
      this.canInstall = false;
      this.installPrompt = null;
    }

    this.cdr.detectChanges();
  }

  toggleUserMenu() {
    this.showUserDropdown = !this.showUserDropdown;
    this.showNotificationDropdown = false;
    this.mobileSearchExpanded = false;
    this.showSearchResults = false;
    this.cdr.detectChanges();
  }

  toggleNotificationMenu(event: Event) {
    event.stopPropagation();
    this.showNotificationDropdown = !this.showNotificationDropdown;
    this.showUserDropdown = false;
    this.mobileSearchExpanded = false;
    this.showSearchResults = false;
    this.cdr.detectChanges();
  }

  toggleMobileSearch(event: Event) {
    event.stopPropagation();
    this.mobileSearchExpanded = !this.mobileSearchExpanded;

    if (!this.mobileSearchExpanded) {
      this.showSearchResults = false;
    }

    this.showUserDropdown = false;
    this.showNotificationDropdown = false;
    this.cdr.detectChanges();
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
    event.stopPropagation();

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
    event.stopPropagation();

    if (route) {
      this.navigateTo(route);
    }
  }

  isItemActive(item: MenuItem): boolean {
    if (item.children?.length) {
      return item.children.some((child) => this.router.url.startsWith(child.route || ''));
    }

    return item.route ? this.router.url.startsWith(item.route) : false;
  }

  isShortcutActive(route: string): boolean {
    return this.router.url.startsWith(route);
  }

  closeSidebarOnCompactViewport() {
    if (this.isCompactViewport && this.sidebarOpen) {
      this.sidebarOpen = false;
      this.cdr.detectChanges();
    }
  }

  onNotificationClick(notification: NotificationItem, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.showNotificationDropdown = false;

    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id).subscribe();
    }

    if (notification.deeplink) {
      this.router.navigateByUrl(notification.deeplink);
    }
  }

  viewAllNotifications(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.showNotificationDropdown = false;
    this.router.navigate(['/notifications']);
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

  onSearchChange() {
    const term = this.searchText.toLowerCase().trim();

    if (!term) {
      this.filteredResults = [];
      this.showSearchResults = false;
      return;
    }

    const allItems: Array<{ label: string; icon: string; route: string; parent: string }> = [];

    this.menuItems.forEach((parent) => {
      if (parent.children?.length) {
        parent.children.forEach((child) => {
          if (child.route) {
            allItems.push({
              label: child.label,
              icon: child.icon,
              route: child.route,
              parent: parent.label,
            });
          }
        });
        return;
      }

      if (parent.route && parent.route !== 'javascript:void(0)') {
        allItems.push({
          label: parent.label,
          icon: parent.icon,
          route: parent.route,
          parent: 'Navigation',
        });
      }
    });

    this.filteredResults = allItems.filter((item) => item.label.toLowerCase().includes(term));
    this.showSearchResults = this.filteredResults.length > 0;
    this.activeIndex = 0;
  }

  navigateTo(route: string) {
    this.searchText = '';
    this.showSearchResults = false;
    this.mobileSearchExpanded = false;
    this.router.navigate([route]);
    this.closeSidebarOnCompactViewport();
  }

  moveActive(direction: number) {
    if (!this.showSearchResults || !this.filteredResults.length) {
      return;
    }

    this.activeIndex += direction;

    if (this.activeIndex < 0) {
      this.activeIndex = this.filteredResults.length - 1;
    }

    if (this.activeIndex >= this.filteredResults.length) {
      this.activeIndex = 0;
    }
  }

  selectActive() {
    if (!this.showSearchResults) {
      return;
    }

    const item = this.filteredResults[this.activeIndex];

    if (item) {
      this.navigateTo(item.route);
    }
  }

  trackByLabel(_: number, item: MenuItem | QuickLink) {
    return item.label;
  }
}
