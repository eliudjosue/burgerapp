import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-product-image-placeholder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      viewBox="0 0 200 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      class="w-3/5 max-w-[160px] h-auto"
    >
      <!-- Top bun -->
      <path
        d="M28 66 C28 34 60 14 100 14 C140 14 172 34 172 66 L172 74 L28 74 Z"
        fill="var(--color-accent)"
        opacity="0.55"
      />
      <!-- Sesame seeds -->
      <ellipse cx="76" cy="38" rx="8" ry="5.5" fill="var(--color-accent-on)" opacity="0.65"/>
      <ellipse cx="102" cy="28" rx="8" ry="5.5" fill="var(--color-accent-on)" opacity="0.65"/>
      <ellipse cx="128" cy="40" rx="8" ry="5.5" fill="var(--color-accent-on)" opacity="0.65"/>
      <!-- Lettuce (wavy) -->
      <path
        d="M26 79 Q33 71 40 79 Q47 71 54 79 Q61 71 68 79 Q75 71 82 79 Q89 71 96 79 Q103 71 110 79 Q117 71 124 79 Q131 71 138 79 Q145 71 152 79 Q159 71 166 79 Q170 75 174 79"
        stroke="var(--color-accent-secondary)"
        stroke-width="9"
        stroke-linecap="round"
        fill="none"
        opacity="0.75"
      />
      <!-- Cheese -->
      <rect x="22" y="80" width="156" height="8" rx="4" fill="var(--color-warn)" opacity="0.7"/>
      <!-- Patty -->
      <rect x="26" y="88" width="148" height="16" rx="8" fill="var(--color-fg)" opacity="0.35"/>
      <!-- Bottom bun -->
      <rect x="32" y="106" width="136" height="22" rx="11" fill="var(--color-accent)" opacity="0.45"/>
    </svg>
  `,
  host: {
    class: 'flex items-center justify-center w-full h-full',
    style: 'background-color: color-mix(in oklch, var(--color-accent) 12%, transparent)',
  },
})
export class ProductImagePlaceholderComponent {}
