# Business.md — Reglas de negocio del proyecto

> Este documento es la fuente de verdad sobre QUÉ hace el negocio y POR QUÉ.
> No define diseño visual ni implementación técnica. Cualquier decisión de
> UI, base de datos o código debe ser consistente con lo que está acá.
> Si algo no está definido en este documento, no se debe asumir: hay que
> preguntar antes de inventar una regla de negocio nueva.

## 1. Descripción del negocio

Local de venta de hamburguesas, combos y bebidas. Opera **a puerta cerrada**:
no es un local de paso ni tiene atención presencial para pedir — los clientes
llegan exclusivamente a través de la web (por publicidad o por WhatsApp) y
hacen su pedido ahí. El negocio recién está empezando.

El mismo aplicativo cumple dos funciones:

1. **Cara pública**: vidriera de productos y toma de pedidos para el cliente final.
2. **Herramienta operativa interna**: organización del local (cocina, caja,
   administración) para gestionar pedidos, stock de productos visibles y
   métricas del negocio.

## 2. Alcance — Fase 1 (MVP)

Esta es la versión que sale primero. Todo lo que no está listado acá
explícitamente se considera Fase 2 y NO debe construirse todavía, aunque
el modelo de datos pueda dejar lugar para extenderlo después.

### 2.1 Cliente (sin necesidad de cuenta)

- El cliente **nunca necesita registrarse ni loguearse** para hacer un pedido.
  Cada pedido se identifica con los datos que el cliente ingresa en ese momento
  (nombre, teléfono, dirección).
- Catálogo navegable por categorías (ej: hamburguesas, combos, bebidas, postres).
- Cada producto tiene: nombre, descripción, precio, foto, estado
  (activo/inactivo). Si está inactivo, no se muestra en el catálogo público
  (no se muestra como "agotado", simplemente no aparece).
- Existen **combos**: un producto especial que agrupa otros productos
  existentes. Un combo es una entidad de catálogo más (tiene su propio precio,
  no es necesariamente la suma de sus partes).
- Carrito de compras: agregar, quitar, modificar cantidades, ver subtotal.
  El carrito vive en el navegador del cliente (no se guarda en el servidor
  hasta que se confirma el pedido).
- Checkout requiere:
  - Nombre del cliente
  - Teléfono
  - Tipo de entrega: **retiro en local** o **delivery**
  - Si es delivery: dirección + selección de **zona de delivery** (ver punto 3)
  - Comentarios adicionales (opcional, ej: "sin cebolla")
  - Método de pago (ver punto 4)
- Al confirmar el pedido, el cliente recibe un **número de pedido**.
- El cliente puede consultar el estado de su pedido en cualquier momento
  ingresando número de pedido + teléfono. No requiere cuenta ni login.
- Botón de WhatsApp visible en la web: abre WhatsApp con un mensaje
  pre-armado (link tipo `wa.me`, sin automatización de respuestas en esta fase).

### 2.2 Delivery y zonas

- El negocio tiene **delivery propio** (no se integra ni se depende de
  apps de delivery de terceros).
- El costo de envío se calcula por **zona simple**: el admin define entre
  3 y 5 zonas con nombre y costo fijo cada una (ej: "Centro — $500",
  "Barrio Norte — $800"). No hay mapa, no hay polígonos, no hay geofencing
  en esta fase.
- El cliente elige su zona de una lista al momento del checkout. El costo
  de envío se suma automáticamente al total.
- No existe bloqueo geográfico automático: si el cliente no encuentra su
  zona en la lista, hoy no hay mecanismo de impedir el pedido (se asume que
  el local maneja esto manualmente al contactar al cliente si hace falta).
- Retiro en local: costo de envío $0, no requiere zona ni dirección.

### 2.3 Pago

Existen tres métodos de pago disponibles para el cliente en el checkout:

1. **Efectivo**: se paga al recibir/retirar. El pedido queda con estado de
   pago "a confirmar al entregar", no requiere ninguna acción digital.
2. **Transferencia bancaria**: al elegir esta opción, se le muestran al
   cliente los datos para transferir (alias/CBU del negocio, editable por
   el admin desde "Configuración del sitio", ver punto 2.6). El pedido
   queda con estado de pago **"pendiente de confirmación"** hasta que alguien
   del staff (caja) verifica manualmente que la transferencia llegó y la
   marca como confirmada.
3. **Mercado Pago**: se genera un link de pago (Checkout Pro). El cliente
   paga fuera del flujo de la app y el sistema recibe la confirmación de
   pago de forma automática (vía notificación/webhook de Mercado Pago).

**Regla clave: el estado del pago es independiente del estado del pedido.**
Un pedido puede estar "en preparación" mientras su pago todavía está
"pendiente de confirmar" (caso típico de transferencia). Nunca se debe asumir
que avanzar el estado del pedido implica que el pago ya está confirmado, ni
viceversa.

### 2.4 Estados del pedido

Un pedido recorre los siguientes estados, en este orden (no se pueden saltear
etapas salvo cancelación):

1. **Pendiente** — el pedido llegó pero todavía nadie del local lo confirmó.
2. **Confirmado** — caja/admin revisó el pedido y lo aceptó.
3. **En preparación** — cocina está armando el pedido.
4. **Listo** — el pedido está armado, esperando salir (delivery) o ser
   retirado.
5. **En camino** — únicamente aplica si es delivery. Se omite si es retiro
   en local (en ese caso "Listo" pasa directo a "Entregado" cuando el
   cliente retira).
6. **Entregado** — pedido finalizado con éxito.

Adicionalmente, un pedido puede pasar a **Cancelado** desde cualquier estado
anterior a "Entregado".

### 2.5 Roles del personal (staff)

El personal accede al panel de administración mediante usuario y contraseña
(login). Existen tres roles con permisos distintos. Los roles son
acumulativos en el sentido de que Admin puede hacer todo lo de Cocina y Caja,
pero Cocina y Caja NO pueden hacer lo que hace Admin.

**Cocina**
- Ve únicamente los pedidos en estado "Confirmado" o "En preparación".
- Puede avanzar el estado: Confirmado → En preparación → Listo.
- No ve precios totales, no ve reportes, no gestiona productos.
- No tiene acceso a información de pago.

**Caja**
- Ve todos los pedidos entrantes, incluyendo los "Pendientes".
- Puede confirmar pedidos nuevos (Pendiente → Confirmado).
- Puede confirmar manualmente pagos por transferencia.
- Puede avanzar el estado del pedido en la etapa de entrega: Listo →
  En camino → Entregado.
- Puede ver el detalle completo de cada pedido (cliente, productos, total,
  método de pago).
- No gestiona productos, categorías ni promociones.
- No tiene acceso a reportes de ventas.

**Admin**
- Acceso completo: todo lo de Cocina y Caja, más:
  - Gestión de productos (crear, editar, activar/desactivar, foto, precio).
  - Gestión de categorías (crear, editar, eliminar).
  - Gestión de zonas de delivery (crear zona + costo).
  - Gestión de promociones y combos (crear combo, descuentos temporales,
    marcar producto como destacado).
  - Reportes: ventas diarias/semanales/mensuales, productos más vendidos.
  - Alta y gestión de usuarios de staff (crear cuentas de Cocina/Caja).
  - **Gestión de contenido del sitio** (ver punto 2.6 más abajo).

### 2.6 Gestión de contenido del sitio (CMS básico)

El admin necesita poder modificar el contenido visual de la página pública
**sin depender de un desarrollador**. Esto es distinto de la gestión de
productos (punto 2.5): acá se gestiona el contenido propio de la página,
no el catálogo.

Desde una pantalla de "Configuración del sitio" (o "Contenido"), el admin
puede editar:

- **Logo del negocio** (subir/reemplazar imagen).
- **Banner principal de la home**: imagen + texto promocional (ej. título,
  bajada, y opcionalmente a qué categoría o producto lleva el botón del
  banner). Pensado para cambiarse seguido (nuevas promos, temporadas).
- **Horarios de atención** que se muestran en la web (texto editable, sin
  lógica de "abierto/cerrado" automática en esta fase — es información
  informativa, no bloquea pedidos fuera de horario).
- **Datos de contacto**: número de WhatsApp (usado para el botón de la
  home) y cualquier otro dato de contacto que se muestre públicamente.
- **Datos para transferencia bancaria**: alias/CBU que se le muestra al
  cliente cuando elige ese método de pago en el checkout (ver punto 2.3).
  Se incluye acá porque es contenido editable por el admin, igual que el
  resto de esta sección, aunque se use dentro del flujo de checkout.

Este contenido no requiere versionado ni historial de cambios en esta fase:
el admin edita y el cambio se refleja directamente en la web pública.

### 2.7 Notificaciones en tiempo real

- Cuando entra un pedido nuevo, el personal de Caja y Cocina debe enterarse
  sin necesidad de recargar la página (alerta visual y/o sonora dentro del
  panel). Esto aplica solo al panel interno, no a notificaciones push al
  celular del cliente en esta fase.

### 2.8 Reportes (Fase 1, versión simple)

- Ventas del día, de la semana y del mes (montos totales).
- Listado de productos más vendidos.
- No incluye gráficos comparativos avanzados ni exportación en esta fase.

## 3. Fuera de alcance — Fase 2 (explícitamente NO se construye ahora)

Listado para que quede claro qué se está posponiendo y por qué, no porque
no importe:

- **WhatsApp Business API con automatización real** (respuesta automática
  cuando el cliente escribe). En Fase 1 solo hay un botón/link simple.
- **Mapa real con zonas dibujadas (Google Maps) y bloqueo geográfico
  automático** de pedidos fuera de cobertura. En Fase 1 las zonas son una
  lista simple definida a mano por el admin.
- **Cuentas de cliente con login e historial de pedidos**. En Fase 1 el
  cliente siempre pide como invitado.
- **Reportes avanzados**: gráficos, comparativas históricas, exportación
  a Excel/PDF.
- **Integración de pago más profunda** (Checkout API / Bricks de Mercado
  Pago en vez de Checkout Pro), pensada para si el volumen de ventas lo
  justifica más adelante.
- **Multi-sucursal**: todo el modelo de Fase 1 asume un solo local físico.

## 4. Principios que no deben romperse al construir

- El cliente final **nunca** debe necesitar crear una cuenta para comprar.
- El estado de pago y el estado del pedido se gestionan y muestran por
  separado; nunca se infiere uno a partir del otro.
- Los permisos por rol (Cocina/Caja/Admin) no son solo una cuestión de qué
  botones se muestran en la pantalla: el sistema debe impedir a nivel de
  datos que un usuario de Cocina, por ejemplo, pueda leer reportes de ventas
  aunque intente acceder directamente.
- Ningún producto inactivo debe ser visible ni comprable desde la web pública.
- Las zonas de delivery y sus costos son configurables por el admin sin
  necesidad de tocar código.
- El contenido visual de la página pública (logo, banner, horarios, datos
  de contacto, datos de transferencia) es editable por el admin desde el
  panel, sin necesidad de tocar código ni depender de un desarrollador.
- Todo dato de negocio (productos, precios, zonas, estados) vive en la base
  de datos, nunca hardcodeado en el frontend.