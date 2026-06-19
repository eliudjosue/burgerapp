# Brand Spec — Hamburguesería (Food Delivery)

> Visual direction confirmed by user: PedidosYa / Rappi modern food delivery style.
> Reference images attached: `mqla3vpb-image.png`, `mqla2hnq-image.png` (could not read directly — inferred from confirmed style direction).

## Color System

| Token | Value | Role |
|---|---|---|
| `--bg` | `#faf9f6` | Page background — warm off-white |
| `--surface` | `#ffffff` | Cards, modals, raised areas |
| `--fg` | `#1c1a17` | Primary text — warm near-black |
| `--muted` | `#6b6760` | Secondary text, hints, captions |
| `--border` | `#e5e1da` | Hairlines, dividers, card edges |
| `--accent` | `#d4532e` | Primary CTAs, links, hero accent — warm red-orange, appetizing |
| `--accent-on` | `#ffffff` | Text on accent backgrounds |
| `--success` | `#1a9d5a` | Confirmed payments, ready states |
| `--warn` | `#e09d1a` | Pending payment, attention needed |
| `--danger` | `#d43a3a` | Canceled orders, errors |

**Usage rules:**
- `--accent` at most twice per screen (eyebrow + primary CTA is the budget)
- `--success` / `--warn` / `--danger` reserved for status indicators only, not decoration
- Never use raw hex outside `:root`; always `var(--*)` or `color-mix(in oklch, ...)`

## Typography

- **Display / headings:** `'Inter', -apple-system, system-ui, sans-serif` — weight 600, `-0.02em` letter-spacing
- **Body:** `'Inter', -apple-system, system-ui, sans-serif` — weight 400, line-height 1.5
- **Mono:** `ui-monospace, 'JetBrains Mono', monospace` — tabular numerics, status badges, metadata
- **Scale:** 12 / 14 / 16 / 19 / 22 / 32 / 44 / 64 (clamp fluid for hero)
- **Display sizes (≥32px):** `line-height: 1.1`, `letter-spacing: -0.015em`

## Component Language

- **Product cards:** Large food photo (16:10), name + price overlay or below, add-to-cart button. Min 44px hit targets.
- **Buttons:** 10px radius, 11px/20px padding. Primary = accent fill, white label. Large variant for mobile CTAs (14px/28px padding).
- **Inputs:** 1px border, 10px radius, 11px/14px padding, accent focus ring.
- **Status badges:** Pill shape, tinted background (`color-mix(in oklch, var(--success) 14%, transparent)`), mono label.
- **Bottom sheet / cart drawer:** Slides up from bottom on mobile, covers ~60% of screen. Side panel on desktop.

## Layout Principles (Food Delivery)

- **Mobile (360–430px):** Single column, bottom nav (home / catálogo / carrito), full-width product cards, sticky cart bar.
- **Tablet (768–820px):** Two-column product grid, side-panel cart, split-screen kitchen view.
- **Desktop (1280+):** Max-width 1200px, three-column product grid, floating cart side panel, full admin interface.
- **Food photography** is the dominant visual element — cards prioritize image real estate over text.
- **CTAs** are full-width on mobile (thumbs reach), compact on desktop.
- **Internal panel:** Denser layout, mono-heavy, colored status rows, 4px grid, no food photography.

## Internal Panel Identity

- Darker, more utilitarian palette: `--bg: #f5f4f1`, `--surface: #ffffff`
- Status-driven: each order row gets a left border color matching its state
- Fonts stay the same but at smaller sizes (13px body, 11px meta)
- No decorative elements — every pixel carries information
