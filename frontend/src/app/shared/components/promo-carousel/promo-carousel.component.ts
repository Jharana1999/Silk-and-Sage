import { Component, OnInit, OnDestroy, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Promo {
  tag: string;
  highlight: string;
  title: string;
  description: string;
  cta: string;
  queryParams: Record<string, string | boolean>;
  accent: 'sage' | 'gold';
}

@Component({
  selector: 'app-promo-carousel',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="relative w-full max-w-md select-none"
      (mouseenter)="pause()"
      (mouseleave)="resume()"
    >
      <div class="overflow-hidden shadow-luxury">
        <div
          class="flex transition-transform duration-700 ease-in-out"
          [style.transform]="'translateX(-' + active() * 100 + '%)'"
        >
          @for (promo of promos; track promo.title) {
            <div class="min-w-full">
              <article
                class="relative overflow-hidden bg-white p-8 sm:p-10"
                [class.border-t-4]="true"
                [class.border-sage-600]="promo.accent === 'sage'"
                [class.border-gold-500]="promo.accent === 'gold'"
              >
                <span
                  class="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-10"
                  [class.bg-sage-600]="promo.accent === 'sage'"
                  [class.bg-gold-500]="promo.accent === 'gold'"
                ></span>

                <p class="font-sans text-xs uppercase tracking-[0.3em] text-gold-600 mb-4">
                  {{ promo.tag }}
                </p>
                <p
                  class="font-serif text-5xl font-semibold leading-none mb-3"
                  [class.text-sage-700]="promo.accent === 'sage'"
                  [class.text-gold-600]="promo.accent === 'gold'"
                >
                  {{ promo.highlight }}
                </p>
                <h3 class="font-serif text-xl text-sage-800 mb-2">{{ promo.title }}</h3>
                <p class="font-sans text-sm text-gray-500 font-light leading-relaxed mb-6">
                  {{ promo.description }}
                </p>
                <a
                  routerLink="/shop"
                  [queryParams]="promo.queryParams"
                  class="font-sans text-xs uppercase tracking-widest font-medium inline-flex items-center gap-2 text-sage-600 hover:text-sage-800 transition-colors"
                >
                  {{ promo.cta }}
                  <span aria-hidden="true">&rarr;</span>
                </a>
              </article>
            </div>
          }
        </div>
      </div>

      <div class="flex items-center justify-center gap-2 mt-5">
        @for (promo of promos; track promo.title; let i = $index) {
          <button
            type="button"
            (click)="goTo(i)"
            [attr.aria-label]="'Show offer ' + (i + 1)"
            [attr.aria-current]="active() === i"
            class="h-1.5 rounded-full transition-all duration-300"
            [class.w-6]="active() === i"
            [class.bg-sage-600]="active() === i"
            [class.w-1.5]="active() !== i"
            [class.bg-sage-300]="active() !== i"
          ></button>
        }
      </div>
    </div>
  `,
})
export class PromoCarouselComponent implements OnInit, OnDestroy {
  private static readonly INTERVAL_MS = 4500;
  private timer?: ReturnType<typeof setInterval>;

  readonly active = signal(0);

  readonly promos: Promo[] = [
    {
      tag: 'Limited Time',
      highlight: 'Buy 1 Get 1',
      title: 'On Select Sheet Masks',
      description: 'Stock up on your weekly self-care ritual — pick two, pay for one.',
      cta: 'Shop Masks',
      queryParams: { category: 'masks' },
      accent: 'gold',
    },
    {
      tag: 'Serum Edit',
      highlight: '15% Off',
      title: 'Brightening Serums',
      description: 'The Ordinary, Klairs and more — targeted treatments at our best price.',
      cta: 'Shop Serums',
      queryParams: { category: 'serums' },
      accent: 'sage',
    },
    {
      tag: 'Bestsellers',
      highlight: '20% Off',
      title: "Nepal's Most Loved",
      description: 'Tried, tested and loved by thousands across the country.',
      cta: 'Shop Bestsellers',
      queryParams: { is_bestseller: true },
      accent: 'gold',
    },
    {
      tag: 'Every Order',
      highlight: 'Free Delivery',
      title: 'On Orders Over Rs. 2,000',
      description: 'Fast, reliable delivery across Nepal — straight to your door.',
      cta: 'Start Shopping',
      queryParams: {},
      accent: 'sage',
    },
  ];

  ngOnInit(): void {
    this.start();
  }

  ngOnDestroy(): void {
    this.stop();
  }

  goTo(index: number): void {
    this.active.set(index);
    this.resume();
  }

  pause(): void {
    this.stop();
  }

  resume(): void {
    this.start();
  }

  private start(): void {
    this.stop();
    this.timer = setInterval(() => {
      this.active.update(i => (i + 1) % this.promos.length);
    }, PromoCarouselComponent.INTERVAL_MS);
  }

  private stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }
}
