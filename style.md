# Style.md — Sistema de diseño (v2 — rediseño artesanal)

> Este documento reemplaza la versión anterior (estilo "delivery
> genérico" tipo PedidosYa/Rappi, naranja vibrante). La nueva dirección
> es **cálida y artesanal**: tonos tierra, sensación de hamburguesería
> premium con identidad propia, alejada del molde visual típico de apps
> de delivery. Cualquier componente Angular debe implementarse siguiendo
> estos valores exactos — no inventar colores, tamaños o espaciados
> nuevos sin necesidad real.

## 0. Dirección de diseño (léase antes que nada)

- **Sensación buscada**: hamburguesería artesanal/premium, no app de
  delivery genérica. Calidez por sobre vibrancia.
- **Paleta**: tonos tierra (terracota, crema, marrón cálido), con un
  verde oliva como acento secundario para dar variedad sin romper la
  paleta.
- **Tipografía**: títulos con carácter (peso medio/alto, look moderno
  pero cálido), cuerpo de texto limpio y legible. Nunca fría/corporativa.
- **Formas**: se mantienen los bordes redondeados (no se busca un giro
  hacia formas rectas/editoriales), pero el cambio de identidad viene
  del color y la tipografía, no de la geometría.
- Fotografía de producto sigue siendo protagonista en el catálogo — esto
  no cambia respecto a la versión anterior.

## 1. Paleta de colores

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#F5EBDD` | Fondo de página (lado cliente) — crema cálido |
| `--surface` | `#FFFBF5` | Tarjetas, modales, superficies elevadas — blanco cálido, no blanco puro |
| `--fg` | `#2E2520` | Texto principal — marrón casi negro |
| `--muted` | `#5A4D42` | Texto secundario, hints, metadata — marrón medio |
| `--border` | `#E0D2BC` | Líneas divisorias, bordes de tarjetas — beige cálido |
| `--accent` | `#B5651D` | CTAs primarios, links, acento de marca — terracota quemado |
| `--accent-on` | `#FFF7EC` | Texto sobre fondo de acento — crema, no blanco puro |
| `--accent-secondary` | `#4F6F52` | Acento secundario — verde oliva (badges de combo/destacado, variedad puntual) |
| `--success` | `#3E7A4F` | Pago confirmado, pedido listo/entregado — verde más oscuro que el acento secundario, para no confundirse |
| `--warn` | `#C08A2E` | Pendiente de confirmación / atención — ámbar tierra |
| `--danger` | `#A23E3E` | Cancelado, error — rojo terracota apagado, no rojo puro |

Variantes "soft" (fondos tenues para badges, generadas con `color-mix`):
`--accent-soft`, `--accent-secondary-soft`, `--success-soft`, `--warn-soft`, `--danger-soft`, `--fg-soft`
(mezcla del color base al 14% sobre transparente, excepto `--fg-soft` al 6%).

**Reglas de uso:**
- `--accent` (terracota) se usa con moderación: CTA principal y algún acento puntual, no decoración.
- `--accent-secondary` (verde oliva) se reserva para variedad puntual (ej. badge de "combo", algún ícono), nunca compite con `--accent` como color principal de acción.
- `--success` / `--warn` / `--danger` se reservan exclusivamente para indicar estados (pago, pedido), nunca como color decorativo.
- El panel interno (staff) usa fondo `--bg-staff: #EFE6D8` — una variante un poco más neutra del crema, para diferenciar visualmente "modo operativo" de "modo vidriera". El resto de la paleta se mantiene igual en ambos lados.
- Nunca usar valores hex sueltos en el código: siempre referenciar los tokens (variables CSS / variables de tema en Angular).
- **Importante para la migración**: todo uso de `--accent: #d4532e` (naranja-rojizo de la versión anterior) debe reemplazarse por `--accent: #B5651D` (terracota). No deben quedar referencias al naranja vibrante anterior en ningún componente.

## 2. Tipografía

- **Títulos**: `'Poppins', -apple-system, system-ui, sans-serif` — peso 500/600. Da el carácter cálido-moderno buscado, sin caer en algo frío o puramente corporativo.
- **Cuerpo**: `'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif` — peso 400, limpio y legible.
- **Mono**: `ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace` — reservada para números tabulares, códigos de pedido, badges de estado, y metadata técnica (timestamps, IDs). Sin cambios respecto a la versión anterior.

**Escala:**

| Estilo | Tamaño | Familia/Peso | Uso |
|---|---|---|---|
| H1 | `clamp(36px, 5vw, 56px)` | Poppins 600 | Título principal de home |
| H2 | `clamp(26px, 3.5vw, 40px)` | Poppins 600 | Títulos de sección |
| H3 | `20px` | Poppins 500 | Nombre de producto, subtítulos |
| Body | `16px` / line-height 1.55 | Inter 400 | Texto general |
| Small | `14px` | Inter 400 | Texto secundario, descripciones cortas |
| XS | `12px` | Inter 400 | Metadata, captions |
| 2XS | `11px` | Inter 400/500 o mono | Labels uppercase, badges, mono |

- Títulos (`h1`, `h2`, `h3`) llevan `letter-spacing` ligeramente negativo (entre `-0.005em` y `-0.015em`) — más sutil que en la versión anterior, ya que Poppins ya tiene presencia propia y no necesita comprimirse tanto.
- El texto de cuerpo nunca lleva `letter-spacing` ajustado.

## 3. Espaciado

Sin cambios respecto a la versión anterior — escala de espaciado en base 4px, variables `--space-1` a `--space-20`:

`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80` (px)

El "gutter" (padding lateral del contenedor) cambia según breakpoint:
- Mobile: `16px`
- Tablet (≥768px): `20px`
- Desktop (≥1024px): `24px`

Ancho máximo de contenedor (`--container`): `1200px`, centrado.

## 4. Bordes y radios

Sin cambios respecto a la versión anterior — se mantienen los bordes redondeados, el cambio de identidad es de color/tipografía, no de geometría.

| Token | Valor | Uso |
|---|---|---|
| `--radius-sm` | `8px` | Botones, inputs, tarjetas pequeñas |
| `--radius-md` | `12px` | Tarjetas de producto, cards generales |
| `--radius-lg` | `16px` | Elementos grandes (poco usado) |
| `--radius-pill` | `9999px` | Badges, botones tipo cápsula |

## 5. Componentes

### Botones
- Variantes: `primary` (fondo `--accent` terracota, texto `--accent-on` crema), `secondary` (transparente, borde `--border`), `ghost` (transparente, sin borde, hover en `--accent`).
- Tamaño normal: padding `10px 18px`, `15px` de fuente (Inter, no Poppins — los botones usan la tipografía de cuerpo, los títulos son los únicos en Poppins).
- Tamaño `large` (uso mobile, CTAs principales): padding `14px 28px`, `17px` de fuente.
- Variante `block`: ancho completo (`width: 100%`) — se usa en CTAs mobile de checkout/carrito.
- Variante `icon`: cuadrado de `44px × 44px`, mínimo tappeable.
- Estado `:active` baja levemente (`translateY(1px)`) para feedback táctil.

### Tarjetas de producto (`card-product`)
- Imagen con `aspect-ratio: 16/10`, `object-fit: cover`, esquinas redondeadas (`radius-md`) en toda la tarjeta (`overflow: hidden`).
- Cuerpo debajo de la imagen: nombre (16px, Poppins 500), descripción corta (13px, `--muted`, Inter), precio (18px, Poppins 600, color `--accent`), botón "Agregar" debajo.
- Hover (desktop): sombra suave `0 2px 12px rgba(46, 37, 32, 0.08)` (el color de la sombra usa un tinte marrón sutil, no negro puro, para mantener la calidez incluso en sombras).
- Si el producto es un combo, badge pequeño con `--accent-secondary` (verde oliva) en la esquina, texto "Combo".

### Inputs y formularios
- Borde `1px solid var(--border)`, radio `--radius-sm`, padding `11px 14px`.
- Focus: borde `--accent` + halo `box-shadow` con `--accent-soft`.
- Labels: `13px`, color `--muted`, peso 500, encima del input, fuente Inter.
- Select usa flecha SVG custom embebida (no el estilo nativo del navegador).

### Badges de estado
- Forma píldora (`radius-pill`), fuente mono `11px` uppercase, padding `3px 10px`.
- Variantes: `success`, `warn`, `danger`, `muted`, `accent` — cada una usa el color base sobre su versión "soft" como fondo.
- Mapeo a estados del negocio (sin cambios de lógica, solo de paleta):
  - `badge-warn` → Pendiente / Pendiente de confirmación de pago
  - `badge-accent` → Confirmado / En preparación / En camino
  - `badge-success` → Listo / Entregado / Pago confirmado
  - `badge-danger` → Cancelado

### Tarjetas de pedido — panel interno (`order-card`)
- Borde izquierdo de 4px que cambia de color según estado (`is-confirmed` → warn, `is-preparing`/`is-delivering` → accent, `is-ready`/`is-delivered` → success).
- Estructura: header (número de pedido + tiempo transcurrido en mono) → badge de estado → lista resumida de items → total → botón de acción principal a ancho completo.
- Pensada para leerse rápido: jerarquía clara, sin texto innecesario.

### Vista de Cocina — tablero kanban (`board`, `board-col`)
- Sin cambios estructurales — columnas por estado, mismo layout. Solo cambia la paleta subyacente (fondo, bordes, badges).

### Inputs de cantidad (carrito / detalle de producto)
- Botones circulares `+`/`–`: `44px` (detalle de producto) o `28px` (dentro del carrito, más compacto), borde `--border`, número centrado entre ambos.

### Navegación
- **Mobile (lado cliente, <1024px)**: bottom nav fija de 4 íconos + label, `60px` de alto, ítem activo en color `--accent`.
- **Cart bar**: barra fija sobre el bottom nav (mobile) con fondo `--fg` (marrón oscuro, no negro), mostrando cantidad de items y total, con CTA de acento — solo visible si hay items en el carrito.
- **Desktop (≥1024px)**: bottom nav y cart bar se ocultan; aparece navegación horizontal en el header (`desktop-nav`).
- **Panel interno**: topbar con título de sección + datos de usuario logueado + logout. Las pantallas separadas (cocina/caja/admin) no usan sidebar fijo del lado del staff en mobile — priorizan pantalla completa para la tarea.

### Timeline de estado de pedido
- Lista vertical de pasos conectados por una línea, cada paso con un punto (`timeline-dot`) que cambia de color según si está pendiente (`--border`), activo (`--accent`) o completado (`--success`).

### Tablas y dashboard admin
- Tablas (`adm-table`): headers en mono uppercase 11px, filas con hover sutil (`--fg-soft`).
- Tarjetas de métrica (`dash-stat`): label pequeño uppercase arriba (Inter), valor grande (32px, Poppins 600) debajo.

## 6. Breakpoints

Sin cambios respecto a la versión anterior.

| Nombre | Ancho | Comportamiento general |
|---|---|---|
| Mobile | hasta 639px | 1 columna, bottom nav, CTAs full-width |
| Tablet pequeño | desde 640px | Grillas pasan a 2 columnas |
| Tablet / desktop chico | desde 768-900px | Ajustes de gutter, algunas grillas a 3 columnas |
| Desktop | desde 1024px | Bottom nav/cart bar ocultos, nav horizontal, grillas a 3-4 columnas, sidebar/paneles completos en admin |

Regla general: **mobile-first**. Los estilos base son para mobile y los `@media (min-width: ...)` van agregando complejidad de layout a medida que crece la pantalla — nunca al revés.

## 7. Identidad visual: lado cliente vs. panel interno

Ambos lados comparten la misma paleta de color y tipografía base. La diferencia sigue siendo de **densidad e intención**, sin cambios respecto a la versión anterior:

- **Lado cliente**: más aire entre elementos, fotografía de producto protagonista, fondo `--bg` cálido (`#F5EBDD`), botones grandes pensados para el pulgar.
- **Panel interno**: fondo levemente más neutro (`#EFE6D8`), tipografía más chica en general (13-14px en vez de 16px de body), mucha más información por pantalla, uso de mono para datos (horas, números de pedido, montos), sin fotografía de producto.

## 8. Imágenes de producto — placeholder mientras no hay fotos reales

El proyecto todavía no tiene fotos reales de producto cargadas (hoy hay
varios placeholders rotos en producción, mostrando el recuadro gris con
borde punteado por defecto de Tailwind cuando una `<img>` no carga —
eso se ve como un error, no como un estado esperado).

Hasta que se carguen fotos reales, cada producto sin imagen debe mostrar
un **placeholder ilustrado y decorativo**, no un ícono genérico simple:

- Una ilustración SVG sencilla relacionada a comida (ej. silueta de
  hamburguesa, plato, o un patrón decorativo abstracto en los tonos de
  la paleta — terracota/crema/oliva), no una foto rota ni un ícono
  monocromático aislado.
- Fondo del placeholder en un tono de la paleta (ej. `--accent-soft` o
  `--accent-secondary-soft`), nunca gris neutro — debe sentirse
  intencional y parte de la marca, no un error visual.
- El mismo placeholder se reutiliza consistentemente en catálogo, home,
  detalle de producto, carrito, y dentro del panel de Admin — un solo
  componente/SVG reusado, no uno distinto por pantalla.
- Cuando el producto sí tiene `imageUrl` cargada, se muestra la foto
  real normalmente; el placeholder solo aparece si el campo está vacío
  o nulo.

## 9. Fuentes web

`Poppins` e `Inter` deben cargarse desde Google Fonts (o el mecanismo
que ya use el proyecto para `Inter`, extendido para incluir `Poppins`).
Pesos necesarios: Poppins 500 y 600; Inter 400.