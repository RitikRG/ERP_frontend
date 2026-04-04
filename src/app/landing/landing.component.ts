import { CommonModule, DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Inject,
  OnDestroy,
} from '@angular/core';
import { RouterLink } from '@angular/router';

interface NavLink {
  label: string;
  href: string;
}

interface PainPoint {
  icon: string;
  title: string;
}

interface Feature {
  icon: string;
  title: string;
  description: string;
  accent?: boolean;
}

interface Step {
  number: string;
  title: string;
  description: string;
}

interface Metric {
  value: string;
  label: string;
}

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  initials: string;
}

interface PricingTier {
  name: string;
  price: string;
  cadence: string;
  summary: string;
  badge?: string;
  accent?: boolean;
  features: string[];
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css'],
})
export class LandingComponent implements AfterViewInit, OnDestroy {
  readonly currentYear = new Date().getFullYear();
  prefersReducedMotion = false;

  private revealObserver?: IntersectionObserver;
  private animationFrameId = 0;
  private pageElement: HTMLElement | null = null;
  private depthElements: HTMLElement[] = [];
  private revealElements: HTMLElement[] = [];

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly elementRef: ElementRef<HTMLElement>
  ) {}

  readonly navLinks: NavLink[] = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Get Started', href: '#contact' },
  ];

  readonly painPoints: PainPoint[] = [
    { icon: 'call_missed', title: 'Missed order requests while staff are busy at the counter.' },
    { icon: 'menu_book', title: 'Khata updates and follow-ups slipping between notebooks and calls.' },
    { icon: 'inventory_2', title: 'Limited visibility into stock, top-moving items, and low inventory.' },
    { icon: 'payments', title: 'Payment collection and delivery coordination happening in separate tools.' },
  ];

  readonly features: Feature[] = [
    {
      icon: 'smart_toy',
      title: 'Order intake from WhatsApp',
      description:
        'Capture customer requests from chat and bring them into a clean order flow your team can act on.',
      accent: true,
    },
    {
      icon: 'point_of_sale',
      title: 'Counter-ready POS',
      description:
        'Fast billing, barcode-assisted entry, and payment capture in the same workspace your staff already uses.',
    },
    {
      icon: 'inventory',
      title: 'Live inventory visibility',
      description:
        'Track stock movement, spot low inventory quickly, and keep product availability aligned with sales.',
    },
    {
      icon: 'book_5',
      title: 'Customer ledger and dues',
      description:
        'Maintain customer balances, payment history, and due reminders without juggling separate records.',
    },
    {
      icon: 'local_shipping',
      title: 'Delivery coordination',
      description:
        'Assign outgoing orders, monitor status, and keep handoff operations clear for delivery staff.',
    },
    {
      icon: 'monitoring',
      title: 'Operational dashboard',
      description:
        'Get one view of sales, purchases, stock, suppliers, and online order activity for the organisation.',
    },
  ];

  readonly steps: Step[] = [
    {
      number: '01',
      title: 'Customer places an order',
      description: 'Orders start from the channels your shop already uses, without extra customer setup.',
    },
    {
      number: '02',
      title: 'ERP organises the workflow',
      description: 'Order details, stock checks, and billing context are brought into one operational queue.',
    },
    {
      number: '03',
      title: 'Team fulfils from one workspace',
      description: 'Staff can accept, bill, prepare, and assign deliveries without switching systems.',
    },
    {
      number: '04',
      title: 'Sales and dues stay updated',
      description: 'Inventory, payments, and customer balance records stay aligned as orders are completed.',
    },
  ];

  readonly metrics: Metric[] = [
    { value: '1', label: 'workspace for sales, inventory, suppliers, and customers' },
    { value: '2', label: 'pricing tiers with a simple onboarding path' },
    { value: '3', label: 'months free before the paid plan begins' },
    { value: '24/7', label: 'public storefront page for new shop onboarding' },
  ];

  readonly testimonials: Testimonial[] = [
    {
      quote:
        'The biggest change is that our team stops chasing information across calls, notes, and separate spreadsheets.',
      name: 'Rajesh Sharma',
      role: 'Kirana owner, Delhi NCR',
      initials: 'RS',
    },
    {
      quote:
        'The dashboard and dues flow make day-end review much cleaner. We can actually see what is pending.',
      name: 'Priya Gupta',
      role: 'General store operator, Noida',
      initials: 'PG',
    },
    {
      quote:
        'Inventory, supplier purchases, and counter billing now feel like parts of one system instead of separate tasks.',
      name: 'Anil Kumar',
      role: 'Retail operator, Gurgaon',
      initials: 'AK',
    },
  ];

  readonly pricingTiers: PricingTier[] = [
    {
      name: 'Launch Access',
      price: 'Free',
      cadence: 'for first 3 months',
      summary: 'Start with the full ERP onboarding flow and validate the setup with your store operations.',
      features: [
        'Public onboarding to your ERP workspace',
        'Core sales, inventory, supplier, and customer modules',
        'Landing-page offer valid for the first 3 months',
      ],
    },
    {
      name: 'Standard',
      price: '₹499',
      cadence: '/ month',
      summary: 'Continue on the paid plan once the 3-month free period ends.',
      badge: 'Recommended',
      accent: true,
      features: [
        'Continued access after the free period',
        'Same ERP workflow across billing, stock, suppliers, and dues',
        'Simple monthly pricing with no extra tier selection on the page',
      ],
    },
  ];

  ngAfterViewInit(): void {
    this.pageElement = this.elementRef.nativeElement.querySelector('.landing-page');
    this.depthElements = Array.from(
      this.elementRef.nativeElement.querySelectorAll<HTMLElement>('[data-depth]')
    );
    this.revealElements = Array.from(
      this.elementRef.nativeElement.querySelectorAll<HTMLElement>('[data-reveal]')
    );

    this.prefersReducedMotion =
      this.document.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches ?? false;

    if (this.prefersReducedMotion) {
      this.revealElements.forEach((element) => element.classList.add('is-visible'));
      return;
    }

    this.setupRevealObserver();
    this.scheduleMotionUpdate();
  }

  ngOnDestroy(): void {
    this.revealObserver?.disconnect();

    if (this.animationFrameId && this.document.defaultView) {
      this.document.defaultView.cancelAnimationFrame(this.animationFrameId);
    }
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  onViewportChange(): void {
    this.scheduleMotionUpdate();
  }

  scrollToSection(event: Event, target: string): void {
    if (!target.startsWith('#')) {
      return;
    }

    event.preventDefault();

    const section = this.document.querySelector<HTMLElement>(target);
    if (!section) {
      return;
    }

    const prefersReducedMotion =
      this.document.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches ?? false;

    section.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });

    this.document.defaultView?.history.replaceState(null, '', target);
  }

  private setupRevealObserver(): void {
    const browserWindow = this.document.defaultView;

    if (!browserWindow || !('IntersectionObserver' in browserWindow)) {
      this.revealElements.forEach((element) => element.classList.add('is-visible'));
      return;
    }

    this.revealObserver = new browserWindow.IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add('is-visible');
          this.revealObserver?.unobserve(entry.target);
        });
      },
      {
        threshold: 0.18,
        rootMargin: '0px 0px -8% 0px',
      }
    );

    this.revealElements.forEach((element) => this.revealObserver?.observe(element));
  }

  private scheduleMotionUpdate(): void {
    if (this.prefersReducedMotion || !this.document.defaultView) {
      return;
    }

    if (this.animationFrameId) {
      return;
    }

    this.animationFrameId = this.document.defaultView.requestAnimationFrame(() => {
      this.animationFrameId = 0;
      this.updateDepthEffects();
    });
  }

  private updateDepthEffects(): void {
    const browserWindow = this.document.defaultView;
    if (!browserWindow || !this.pageElement) {
      return;
    }

    const heroSection = this.elementRef.nativeElement.querySelector<HTMLElement>('.hero-section');
    if (heroSection) {
      const heroRect = heroSection.getBoundingClientRect();
      const heroProgress = this.clamp(
        (browserWindow.innerHeight - heroRect.top) /
          (browserWindow.innerHeight + Math.max(heroRect.height, 1)),
        0,
        1
      );

      this.pageElement.style.setProperty(
        '--hero-tilt-x',
        `${(10 - heroProgress * 14).toFixed(2)}deg`
      );
      this.pageElement.style.setProperty(
        '--hero-tilt-y',
        `${(-14 + heroProgress * 18).toFixed(2)}deg`
      );
      this.pageElement.style.setProperty(
        '--hero-shift',
        `${(26 - heroProgress * 38).toFixed(2)}px`
      );
      this.pageElement.style.setProperty(
        '--hero-glow',
        `${(0.42 + heroProgress * 0.28).toFixed(2)}`
      );
    }

    this.depthElements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      const viewportOffset =
        (rect.top + rect.height / 2 - browserWindow.innerHeight / 2) /
        (browserWindow.innerHeight / 2);

      const shift = this.clamp(-viewportOffset * 18, -18, 18);
      const rotate = this.clamp(viewportOffset * 9, -9, 9);
      const depth = this.clamp((1 - Math.min(Math.abs(viewportOffset), 1)) * 22, 0, 22);

      element.style.setProperty('--depth-shift', `${shift.toFixed(2)}px`);
      element.style.setProperty('--depth-rotate', `${rotate.toFixed(2)}deg`);
      element.style.setProperty('--depth-z', `${depth.toFixed(2)}px`);
    });
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }
}
