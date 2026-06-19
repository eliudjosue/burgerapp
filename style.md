# Style.md — Sistema de diseño

> Este documento es la fuente de verdad sobre CÓMO se ve la aplicación.
> Fue extraído del diseño ya aprobado en `design-reference/` (especialmente
> `style.html`). Cualquier componente Angular debe implementarse siguiendo
> estos valores exactos — no inventar colores, tamaños o espaciados nuevos
> sin necesidad real. Si algo visual no está cubierto acá, conviene
> resolverlo reusando lo más parecido que exista en este documento antes
> de crear un patrón nuevo.

## 1. Paleta de colores

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#faf9f6` | Fondo de página (lado cliente) — blanco cálido |
| `--surface` | `#ffffff` | Tarjetas, modales, superficies elevadas |
| `--fg` | `#1c1a17` | Texto principal — casi negro cálido |
| `--muted` | `#6b6760` | Texto secundario, hints, metadata |
| `--border` | `#e5e1da` | Líneas divisorias, bordes de tarjetas |
| `--accent` | `#d4532e` | CTAs primarios, links, acento de marca (naranja-rojizo) |
| `--accent-on` | `#ffffff` | Texto sobre fondo de acento |
| `--success` | `#1a9d5a` | Pago confirmado, pedido listo/entregado |
| `--warn` | `#e09d1a` | Pendiente de confirmación / atención |
| `--danger` | `#d43a3a` | Cancelado, error |

Variantes "soft" (fondos tenues para badges, generadas con `color-mix`):
`--accent-soft`, `--success-soft`, `--warn-soft`, `--danger-soft`, `--fg-soft`
(mezcla del color base al 14% sobre transparente, excepto `--fg-soft` al 6%).

**Reglas de uso:**
- `--accent` se usa con moderación: CTA principal y algún acento puntual, no decoración.
- `--success` / `--warn` / `--danger` se reservan exclusivamente para indicar estados (pago, pedido), nunca como color decorativo.
- El panel interno (staff) usa fondo `--bg: #f5f4f1` en vez de `#faf9f6` — ligeramente más gris/neutro, para diferenciar visualmente "modo operativo" de "modo vidriera". El resto de la paleta (`--accent`, `--success`, etc.) se mantiene igual en ambos lados.
- Nunca usar valores hex sueltos en el código: siempre referenciar los tokens (variables CSS / variables de tema en Angular).

## 2. Tipografía

- **Familia única**: `Inter` (con fallback a `-apple-system, BlinkMacSystemFont, system-ui, sans-serif`). Se usa tanto para títulos como para texto de cuerpo — no hay una segunda familia decorativa.
- **Mono**: `ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace` — reservada para números tabulares, códigos de pedido, badges de estado, y metadata técnica (timestamps, IDs).

**Escala:**

| Estilo | Tamaño | Peso | Uso |
|---|---|---|---|
| H1 | `clamp(36px, 5vw, 56px)` | 600 | Título principal de home |
| H2 | `clamp(26px, 3.5vw, 40px)` | 600 | Títulos de sección |
| H3 | `20px` | 600 | Nombre de producto, subtítulos |
| Body | `16px` / line-height 1.55 | 400 | Texto general |
| Small | `14px` | 400 | Texto secundario, descripciones cortas |
| XS | `12px` | 400 | Metadata, captions |
| 2XS | `11px` | 400/500 | Labels uppercase, badges, mono |

- Títulos (`h1`, `h2`, `h3`) llevan `letter-spacing` negativo sutil (entre `-0.005em` y `-0.02em` según tamaño) para verse más compactos y modernos.
- El texto de cuerpo nunca lleva `letter-spacing` ajustado.

## 3. Espaciado

Escala de espaciado en base 4px, variables `--space-1` a `--space-20`:

`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80` (px)

El "gutter" (padding lateral del contenedor) cambia según breakpoint:
- Mobile: `16px`
- Tablet (≥768px): `20px`
- Desktop (≥1024px): `24px`

Ancho máximo de contenedor (`--container`): `1200px`, centrado.

## 4. Bordes y radios

| Token | Valor | Uso |
|---|---|---|
| `--radius-sm` | `8px` | Botones, inputs, tarjetas pequeñas |
| `--radius-md` | `12px` | Tarjetas de producto, cards generales |
| `--radius-lg` | `16px` | Elementos grandes (poco usado) |
| `--radius-pill` | `9999px` | Badges, botones tipo cápsula |

## 5. Componentes

### Botones
- Variantes: `primary` (fondo `--accent`, texto blanco), `secondary` (transparente, borde `--border`), `ghost` (transparente, sin borde, hover en `--accent`).
- Tamaño normal: padding `10px 18px`, `15px` de fuente.
- Tamaño `large` (uso mobile, CTAs principales): padding `14px 28px`, `17px` de fuente.
- Variante `block`: ancho completo (`width: 100%`) — se usa en CTAs mobile de checkout/carrito.
- Variante `icon`: cuadrado de `44px × 44px`, mínimo tappeable.
- Estado `:active` baja levemente (`translateY(1px)`) para feedback táctil.

### Tarjetas de producto (`card-product`)
- Imagen con `aspect-ratio: 16/10`, `object-fit: cover`, esquinas redondeadas (`radius-md`) en toda la tarjeta (`overflow: hidden`).
- Cuerpo debajo de la imagen: nombre (16px, 600), descripción corta (13px, `--muted`), precio (18px, 600, color `--accent`), botón "Agregar" debajo.
- Hover (desktop): sombra suave `0 2px 12px rgba(0,0,0,0.06)`.

### Inputs y formularios
- Borde `1px solid var(--border)`, radio `--radius-sm`, padding `11px 14px`.
- Focus: borde `--accent` + halo `box-shadow` con `--accent-soft`.
- Labels: `13px`, color `--muted`, peso 500, encima del input.
- Select usa flecha SVG custom embebida (no el estilo nativo del navegador).

### Badges de estado
- Forma píldora (`radius-pill`), fuente mono `11px` uppercase, padding `3px 10px`.
- Variantes: `success`, `warn`, `danger`, `muted`, `accent` — cada una usa el color base sobre su versión "soft" como fondo.
- Mapeo sugerido a estados del negocio:
  - `badge-warn` → Pendiente / Pendiente de confirmación de pago
  - `badge-accent` → Confirmado / En preparación / En camino
  - `badge-success` → Listo / Entregado / Pago confirmado
  - `badge-danger` → Cancelado

### Tarjetas de pedido — panel interno (`order-card`)
- Borde izquierdo de 4px que cambia de color según estado (`is-confirmed` → warn, `is-preparing`/`is-delivering` → accent, `is-ready`/`is-delivered` → success).
- Estructura: header (número de pedido + tiempo transcurrido en mono) → badge de estado → lista resumida de items → total → botón de acción principal a ancho completo.
- Pensada para leerse rápido: jerarquía clara, sin texto innecesario.

### Vista de Cocina — tablero kanban (`board`, `board-col`)
- Layout específico de `admin-cocina.html`: columnas por estado (`col-pending`, `col-prep`) donde las `order-card` se distribuyen visualmente, similar a un tablero Kanban.
- Pensado para que cocina vea de un vistazo cuántos pedidos hay en cada etapa sin tener que filtrar manualmente.

### Inputs de cantidad (carrito / detalle de producto)
- Botones circulares `+`/`–`: `44px` (detalle de producto) o `28px` (dentro del carrito, más compacto), borde `--border`, número centrado entre ambos.

### Navegación
- **Mobile (lado cliente, <1024px)**: bottom nav fija de 4 íconos + label, `60px` de alto, ítem activo en color `--accent`.
- **Cart bar**: barra fija sobre el bottom nav (mobile) con fondo `--fg` (oscuro), mostrando cantidad de items y total, con CTA de acento — solo visible si hay items en el carrito.
- **Desktop (≥1024px)**: bottom nav y cart bar se ocultan; aparece navegación horizontal en el header (`desktop-nav`).
- **Panel interno**: topbar con título de sección + datos de usuario logueado + logout. Las pantallas separadas (cocina/caja/configuración) no usan sidebar fijo del lado del staff en mobile — priorizan pantalla completa para la tarea.

### Timeline de estado de pedido (`site-estado.html`)
- Lista vertical de pasos conectados por una línea, cada paso con un punto (`timeline-dot`) que cambia de color según si está pendiente (`--border`), activo (`--accent`) o completado (`--success`).

### Tablas y dashboard admin
- Tablas (`adm-table`): headers en mono uppercase 11px, filas con hover sutil (`--fg-soft`).
- Tarjetas de métrica (`dash-stat`): label pequeño uppercase arriba, valor grande (32px, 600) debajo.

## 6. Breakpoints

| Nombre | Ancho | Comportamiento general |
|---|---|---|
| Mobile | hasta 639px | 1 columna, bottom nav, CTAs full-width |
| Tablet pequeño | desde 640px | Grillas pasan a 2 columnas |
| Tablet / desktop chico | desde 768-900px | Ajustes de gutter, algunas grillas a 3 columnas |
| Desktop | desde 1024px | Bottom nav/cart bar ocultos, nav horizontal, grillas a 3-4 columnas, sidebar/paneles completos en admin |

Regla general: **mobile-first**. Los estilos base son para mobile y los `@media (min-width: ...)` van agregando complejidad de layout a medida que crece la pantalla — nunca al revés.

## 7. Identidad visual: lado cliente vs. panel interno

Ambos lados comparten la misma paleta de color y tipografía base. La diferencia es de **densidad e intención**:

- **Lado cliente**: más aire entre elementos, fotografía de producto protagonista, fondo `--bg` cálido (`#faf9f6`), botones grandes pensados para el pulgar.
- **Panel interno**: fondo levemente más neutro (`#f5f4f1`), tipografía más chica en general (13-14px en vez de 16px de body), mucha más información por pantalla, uso de mono para datos (horas, números de pedido, montos), sin fotografía de producto.

## 8. Archivos de referencia

El detalle visual completo y navegable está en `design-reference/`:
- `style.html` — sistema de diseño con todos los swatches y ejemplos de componentes
- `site-*.html` — pantallas del lado cliente
- `admin-login.html`, `admin-cocina.html`, `admin-caja.html`, `admin-configuracion.html` — pantallas del panel interno

> Nota: `design-reference/` contiene también algunos archivos de iteraciones
> descartadas (`admin.html`, `burger-house-prototype.html`) que no representan
> el diseño final y deben ignorarse o eliminarse antes de usarse como
> referencia de desarrollo.