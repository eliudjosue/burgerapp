# AGENTS.md — Guía de trabajo para el agente de desarrollo

> Este documento define CÓMO debe trabajar el agente en este repositorio.
> Se complementa con `business.md` (QUÉ hace el negocio) y `style.md`
> (CÓMO se ve). Los tres documentos viven en la raíz del repo y deben
> leerse en ese orden antes de escribir cualquier código nuevo.

## 0. Reglas de oro

1. **`business.md` es la única fuente de verdad sobre reglas de negocio.**
   Si una funcionalidad no está descrita ahí, no se implementa por
   iniciativa propia: se pregunta primero. No agregar pantallas, campos,
   pasos de checkout, ni reglas de permisos que no estén en ese documento.
2. **`style.md` es la única fuente de verdad sobre diseño visual.** No
   inventar colores, tipografías, tamaños o espaciados nuevos. Si hace
   falta un componente que no está cubierto ahí, se reutiliza el patrón
   más parecido que exista antes de crear uno nuevo, y se avisa que se
   está extendiendo el sistema de diseño.
3. **El esquema de base de datos en Supabase todavía NO está definido
   en detalle, y el agente NO tiene acceso directo al proyecto real de
   Supabase.** El agente escribe el SQL en archivos dentro del repo
   (`database/`) y la persona lo ejecuta a mano en el SQL Editor de
   Supabase. El agente nunca asume que un script ya fue ejecutado contra
   la base real sin confirmarlo antes. (Ver sección 4 más abajo.)
4. Ante cualquier ambigüedad entre lo que muestra `design-reference/`
   (HTML de referencia visual) y lo que dicen `business.md` o `style.md`,
   siempre ganan estos dos últimos documentos. El HTML es solo referencia
   visual, no especificación funcional ni técnica final.
5. Si en `design-reference/` aparecen archivos que no estén listados en
   la sección 6 de este documento (por ejemplo restos de iteraciones
   viejas), ignorarlos — no usarlos como referencia de implementación.
6. **El agente nunca ejecuta comandos destructivos o irreversibles sin
   confirmación explícita previa de la persona**, en particular (lista no
   exhaustiva): `git reset --hard`, `git clean`, borrado de archivos o
   carpetas, sobrescritura de `openspec/config.yaml` u otros archivos de
   configuración del proceso, cualquier comando que descarte cambios no
   commiteados. Si el agente considera que alguna de estas acciones es
   necesaria, debe explicar qué hace, qué se perdería, y esperar una
   confirmación clara de "sí, hacelo" antes de ejecutarla — nunca asumir
   que una instrucción ambigua (como pegar un comando de terminal en el
   chat para pedir ayuda a interpretarlo) es una autorización para
   ejecutar acciones destructivas.
7. **Disciplina de git obligatoria**: la persona hace `git commit` después
   de cada avance aprobado, antes de pedir el siguiente cambio. El agente
   debe recordar esto si nota que pasó un tiempo largo de trabajo sin que
   se haya mencionado un commit, y nunca debe asumir que el trabajo actual
   está "seguro" solo porque existe en el filesystem — si no está
   commiteado, no hay forma de recuperarlo ante un error.
8. **El agente nunca elimina un test que falla como forma de resolver el
   error.** Si un test no pasa, la causa se diagnostica y se corrige (ya
   sea el código de producción o la configuración del test, como
   providers faltantes en `TestBed`). Si el agente no puede resolverlo,
   debe explicar el error real (mensaje completo, no resumido) y esperar
   indicación antes de decidir qué hacer con ese test. Borrar tests para
   que el proyecto "compile" contradice directamente el propósito de
   `strict_tdd: true` y reduce silenciosamente la cobertura sin que la
   persona se entere, salvo que lo revise explícitamente.

## 1. Stack técnico

- **Frontend**: Angular, usando **standalone components** y **signals**
  (no NgModules, no RxJS como mecanismo principal de estado salvo que sea
  estrictamente necesario para un caso async puntual).
- **Estilos**: **Tailwind CSS** (ya configurado en el proyecto). No se debe
  escribir CSS custom con variables tipo `var(--accent)` como aparece en
  los HTML de `design-reference/` — esos archivos son referencia visual,
  no código a copiar literal.
- **Backend**: Supabase (Postgres + Auth + Realtime + Storage + Edge
  Functions). Sin backend propio adicional (sin Node/Express separado):
  toda la lógica de servidor vive en Supabase (Edge Functions cuando haga
  falta lógica que no puede vivir en el cliente, ej. webhook de Mercado
  Pago).
- **Pagos**: Mercado Pago Checkout Pro (link de pago externo + webhook),
  no Checkout API/Bricks en esta fase.

## 2. Traducción de `style.md` a Tailwind (v4)

El proyecto usa **Tailwind CSS v4** (`tailwindcss` + `@tailwindcss/postcss`
en `package.json`). La configuración de tema en v4 es distinta a v3: **no
se usa un archivo `tailwind.config.js` con `theme.extend`** como mecanismo
principal — se usa la directiva `@theme` directamente en el archivo CSS
global (`src/styles.css`), junto al `@import 'tailwindcss';` que ya existe
ahí.

Concretamente, los tokens de `style.md` deben reflejarse así:

```css
@import 'tailwindcss';

@theme {
  --color-bg: #faf9f6;
  --color-surface: #ffffff;
  --color-fg: #1c1a17;
  --color-muted: #6b6760;
  --color-border: #e5e1da;
  --color-accent: #d4532e;
  --color-accent-on: #ffffff;
  --color-success: #1a9d5a;
  --color-warn: #e09d1a;
  --color-danger: #d43a3a;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;

  --font-display: 'Inter', -apple-system, system-ui, sans-serif;
  --font-body: 'Inter', -apple-system, system-ui, sans-serif;
}
```

- Cada variable `--color-*` definida en `@theme` genera automáticamente
  las utilidades de Tailwind correspondientes (`bg-accent`, `text-accent`,
  `border-accent`, etc.) — no hace falta declararlas aparte.
- Para variantes "soft" (`--accent-soft`, etc. en `style.md`), si Tailwind
  v4 no las genera automáticamente como utilidad, definirlas como
  utilidades custom con `@utility` en el mismo `styles.css`, o como clase
  CSS directa usando `color-mix()`.
- Las clases "semánticas" que se vieron usadas en el primer componente
  (`h1`, `h2`, `h3`, `body`, `small`) **no son utilidades nativas de
  Tailwind** y deben definirse explícitamente con `@utility` en
  `styles.css` si se quieren seguir usando así, o reemplazarse por
  combinaciones de utilidades nativas de Tailwind (`text-4xl font-semibold
  tracking-tight`, etc.). No asumir que existen sin haberlas definido — si
  aparecen en un template sin estar definidas en ningún lado, no van a
  aplicar ningún estilo aunque el componente compile y los tests pasen.
- Los breakpoints de la sección 6 de `style.md` (639px, 768-900px, 1024px)
  pueden necesitar definirse con `@theme` también (`--breakpoint-*`) si no
  coinciden con los breakpoints default de Tailwind v4 (`sm`, `md`, `lg`,
  `xl`) — no asumir que coinciden sin revisarlo.
- **Antes de seguir escribiendo componentes que usan clases de color o
  tipografía custom, confirmar primero que `src/styles.css` tiene el
  bloque `@theme` con todos los tokens de `style.md` ya declarados.** Si
  no está, ese es el primer paso a hacer, avisando explícitamente que se
  hizo, antes de continuar con cualquier componente nuevo.

## 3. Estructura de carpetas esperada (Angular)

Organizar por dominio, no por tipo técnico. Sugerido (ajustar si el
proyecto ya tiene otra convención iniciada, pero mantener consistencia):

```
src/app/
  core/              # cross-cutting services (auth, supabase client)
  shared/            # reusable components (button, badge, card)
  features/
    catalog/         # home, catalog, product detail (client side)
    cart/
    checkout/
    order-tracking/  # status lookup by order number + phone
    staff/
      login/
      kitchen/
      cashier/
      admin/
        products/
        categories/
        delivery-zones/
        site-settings/
        reports/
```

- Las rutas del lado cliente son públicas (sin guard de auth).
- Las rutas bajo `staff/` requieren autenticación. Las de `staff/admin/`
  requieren además rol `admin` — el guard de rol debe apoyarse en RLS de
  Supabase como mecanismo real de seguridad, no confiar solo en el guard
  de Angular (que es una capa de UX, no de seguridad).

## 4. Sobre el modelo de datos y cómo se aplica (estado actual: pendiente)

El esquema de tablas de Supabase todavía no fue definido en detalle en
este proyecto. Se sabe que va a incluir, como mínimo, entidades para:
productos, categorías, pedidos (con sus items), zonas de delivery, staff
con roles, y configuración del sitio — todas descritas conceptualmente en
`business.md`.

**Flujo de trabajo para cambios de base de datos (definido y fijo para
esta etapa del proyecto):**

El agente **no tiene credenciales ni acceso directo** al proyecto de
Supabase, y no debe asumir que las tiene ni pedirlas para ejecutar SQL
automáticamente. El flujo es manual, así:

1. Cuando se necesite crear o modificar una tabla, el agente escribe el
   SQL correspondiente (`CREATE TABLE`, `ALTER TABLE`, políticas RLS,
   etc.) en un archivo dentro del repo, en una carpeta `database/` (ej.
   `database/001_create_products.sql`), numerada en orden de aplicación.
2. El agente avisa explícitamente en el chat: qué archivo creó/modificó,
   qué hace ese SQL, y que debe ser ejecutado a mano por la persona en el
   **SQL Editor** del dashboard de Supabase.
3. El agente **nunca asume que el SQL ya fue ejecutado** contra la base
   real. Si una tarea posterior depende de que esa tabla ya exista, debe
   preguntar explícitamente si ya se ejecutó ese script antes de generar
   código que la consuma (ej. un servicio Angular haciendo `.from('products')`).
4. Cada archivo SQL debe ser autocontenido y idealmente idempotente donde
   sea razonable (usar `CREATE TABLE IF NOT EXISTS` cuando tenga sentido,
   para evitar errores si se re-ejecuta por error).

Este flujo es deliberadamente manual para esta etapa del proyecto, mientras
el modelo de datos todavía se está definiendo y conviene revisar cada
cambio antes de aplicarlo. Más adelante, si el esquema se estabiliza, se
puede evaluar pasar a Supabase CLI con migraciones aplicadas automáticamente
— pero ese cambio de flujo debe ser una decisión explícita, no algo que el
agente proponga o aplique por iniciativa propia.

**Mientras el esquema completo no esté confirmado y aplicado:**
- No generar código Angular que asuma que una tabla ya existe en la base
  real sin haber confirmado que el SQL correspondiente ya fue ejecutado.
- Si una tarea requiere datos que todavía no tienen tabla definida, avisar
  explícitamente cuál falta y proponer el SQL correspondiente, en lugar de
  asumir nombres de columnas o relaciones.
- Se puede avanzar con maquetado de UI usando datos mock/hardcodeados de
  forma temporal y claramente señalada como tal (ej. un archivo
  `mock-data.ts` con comentario explícito), nunca mezclado silenciosamente
  con lo que después será una llamada real a Supabase.

Cuando el esquema se confirme y se vaya aplicando, mantener un archivo
`database/README.md` con el orden de ejecución y qué scripts ya fueron
corridos contra el proyecto real, para no perder el rastro de qué existe
hoy en la base.

## 5. Principios de negocio no negociables (resumen — ver `business.md` completo)

- El cliente nunca necesita cuenta para comprar.
- El estado de pago y el estado del pedido son independientes; nunca se
  infiere uno del otro en la UI ni en la lógica.
- Los permisos por rol (cocina/caja/admin) deben reforzarse a nivel de
  base de datos (RLS), no solo ocultando botones en el frontend.
- Ningún producto inactivo se muestra ni se puede comprar desde el lado
  cliente.
- El contenido de "Configuración del sitio" (logo, banner, horarios,
  contacto, datos de transferencia) debe ser editable por el admin sin
  tocar código — es contenido de base de datos, nunca hardcodeado en
  componentes.

## 6. Archivos de referencia válidos en `design-reference/`

Usar como referencia visual SOLO estos archivos. El resto de lo que
exista en esa carpeta (artefactos de iteraciones anteriores) debe
ignorarse:

- `style.html` — sistema de diseño (colores, tipografía, componentes)
- `site-home.html`, `site-catalogo.html`, `site-detalle.html`,
  `site-carrito.html`, `site-checkout.html`, `site-confirmacion.html`,
  `site-estado.html` — lado cliente
- `admin-login.html`, `admin-cocina.html`, `admin-caja.html`,
  `admin-configuracion.html` — panel interno

## 7. Convenciones de código

- **Todo el código en inglés**: nombres de componentes, variables, funciones,
  archivos, carpetas, clases CSS/Tailwind personalizadas. Esto incluye
  también nombres de tablas y columnas en Supabase.
- `business.md` está escrito en español porque es el documento que define
  las reglas para el negocio (el cliente final, en Argentina, piensa en
  español). El código SIEMPRE traduce esos conceptos al inglés. Mapeo de
  referencia para los términos centrales del negocio (mantener esta tabla
  actualizada si aparecen términos nuevos):

  | Español (`business.md`) | Inglés (código) |
  |---|---|
  | pedido | order |
  | estado_pedido | order_status |
  | estado_pago | payment_status |
  | producto | product |
  | categoría | category |
  | combo | combo |
  | zona de delivery | delivery_zone |
  | retiro en local | pickup |
  | delivery | delivery |
  | staff / personal | staff |
  | cocina | kitchen |
  | caja | cashier |
  | admin | admin |
  | configuración del sitio | site_settings |
  | pendiente | pending |
  | confirmado | confirmed |
  | en preparación | preparing |
  | listo | ready |
  | en camino | on_the_way |
  | entregado | delivered |
  | cancelado | cancelled |

  Si aparece un término de negocio nuevo sin traducción definida en esta
  tabla, el agente debe proponer una traducción razonable y dejarla
  asentada acá mismo (actualizando este archivo), en vez de inventar una
  traducción distinta cada vez que el término reaparece.
- La interfaz visible para el usuario final (textos en pantalla, labels,
  mensajes) sigue en **español** siempre — la traducción a inglés aplica
  solo al código, nunca a lo que ve el cliente o el staff.
- Nombres de tablas y columnas en Supabase: `snake_case` en inglés (ej.
  `order_status`, no `estado_pedido` ni `orderStatus`).
- Cada feature nueva debe poder explicarse citando la sección
  correspondiente de `business.md`. Si no se puede citar esa sección,
  probablemente no debería implementarse todavía.