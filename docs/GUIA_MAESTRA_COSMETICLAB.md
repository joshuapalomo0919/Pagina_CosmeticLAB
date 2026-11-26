# CosmeticLAB — Guía maestra de desarrollo

Análisis del proyecto, cobertura del diccionario de datos, plan por fases y prompts para Copilot.
Versión 1 · 19/11/2026

## Cómo usar esta guía

1. Copia `copilot-instructions.md` a `.github/copilot-instructions.md` (Copilot lo lee solo).
2. Guarda esta guía en `docs/GUIA_MAESTRA_COSMETICLAB.md`.
3. Haz `git commit` (idealmente en una rama `fase-N`) **antes** de cada fase. El agente de Copilot puede equivocarse y así puedes volver atrás.
4. Pega el prompt de la fase en Copilot Chat en modo **Agent**. Al terminar: `npm run build` sin errores, prueba la lista "Cómo probar" y haz commit.
5. Pásame los archivos nuevos o una captura y actualizo la sección 9 (registro de avance).

---

## 1. Resumen

| Tema | Estado |
|---|---|
| Páginas que ya existen | Inicio, Productos, Login, Registro, carrito (drawer), idioma ES/EN |
| Entidades | 20 del diccionario original; `Maquilladora` se añadió con autorización y queda pendiente formalizarla en el diccionario |
| Entidades implementadas | 0 completas, 6 parciales, 14 sin empezar |
| Perfiles pedidos | Administrador y Usuario (ambos entran por el mismo login) |
| Estrategia | Tipos idénticos al diccionario + repositorios `async` + semillas desde CSV. Así el cambio a base de datos es de una sola capa. |

---

## 2. Hallazgos del análisis

### 2.1 Lo que ya funciona y se conserva

React + Vite + TypeScript, rutas con `react-router-dom`, contexto de carrito e idioma, registro y login con `localStorage`, diseño y clases en `App.css`.

### 2.2 Choques entre el código actual y el diccionario

| Tema | Código hoy | Diccionario | Decisión |
|---|---|---|---|
| ID de usuario | String `Date.now()-aleatorio` | `INT` (FK en Pedido, Cita y RolUsuario) | Pasar a número autoincremental y migrar los usuarios ya guardados sin perder credenciales |
| Producto | `{id, name, category, price, image}` | `id_producto, nombre, descripcion, precio, stock, imagen, estado, destacado, fecha_registro, id_categoria, id_marca` | Tipo nuevo `Producto`; el componente lee del repositorio; `mockProducts` queda como export obsoleto |
| Categoría | Texto fijo (`'Cuidado Facial'`…) | Tabla con 20 categorías con `id_categoria` | Filtrar por `id_categoria`; el sidebar lee la base |
| Precio | `$45.00` con `toFixed(2)` | COP, `DECIMAL(10,2)`, ejemplo `45000` | Formato COP con `Intl`; precio tomado del `DetalleProducto` vigente |
| Productos de ejemplo | 6 inventados (ids 1–6) | Catálogo real; los ids 1–6 **chocan** con otros nombres (el id 1 es un sérum ácido hialurónico) | Manda el diccionario; la semilla reemplaza los 6 inventados |
| Imágenes | URLs de Unsplash | Rutas `/assets/products/x.jpg` | Archivos en `public/assets/products/`; placeholder si falta; mientras tanto la URL de Unsplash sirve como valor de `imagen` |
| Carrito | `Product[]` en memoria, sin cantidad | `Carrito` + `DetalleCarrito` | Ítems con cantidad, persistidos por usuario (Fase 3) |
| Finalizar compra | Solo vacía el carrito | `Pedido` con método de pago, modalidad y dirección de entrega | Formulario de checkout que crea `Pedido` + `DetallePedido` |
| Sesión | No existe | `RolUsuario` | Fase 1 |
| "Registros guardados" | Visible para **cualquiera** en `/registro` (muestra correo y documento de todos) | Función de administrador | Se mueve a `/admin/usuarios` en la Fase 1 |
| Estado "Agotado" | No existe | `Producto.estado` | Se deriva del stock |
| Idioma | Textos ES/EN en cada componente | Datos en español | La interfaz se traduce; los datos de la base no |

### 2.3 Inconsistencias dentro del diccionario (conviene corregirlas en la hoja antes de crear la BD)

| # | Hallazgo | Riesgo | Corrección recomendada |
|---|---|---|---|
| 1 | Nombres de campo con formatos mezclados: `id_DetalleProducto`, `id_RolUsuario`, `id_ProductoProveedor`, `id_DetalleCita`, `Cantidad_personas`, `Ubicacion` | El JSON de la API no coincide con los tipos y aparece `undefined` sin error visible | Pasar todo a snake_case minúscula: `id_detalle_producto`, `id_rol_usuario`, `id_producto_proveedor`, `id_detalle_cita`, `cantidad_personas`, `ubicacion` |
| 2 | `Producto` y `DetalleProducto` repiten precio, stock e imagen | Se desincronizan | Fuente de verdad: el `DetalleProducto` vigente. `Producto.precio/stock` se actualizan en la misma función cada vez que cambia el detalle |
| 3 | `costo` (DetalleProducto) es igual a `precio_compra` (ProductoProveedor) en todos los ejemplos | Dos fuentes para el mismo dato | El costo se propone desde el proveedor elegido y es editable |
| 4 | En las filas visibles, todas las vigencias terminan el `2026-12-31`. Hoy es 19/11/2026 | En unas 6 semanas ningún precio será vigente | `fecha_fin = NULL` para lo vigente y alerta de vigencias por vencer |
| 5 | `RolUsuario` usa `id_rol` del 1 al 5, pero la tabla `Rol` no se ha visto | No sabemos qué son los roles 3, 4 y 5 | Pasarme la captura de `Rol`. Por ahora se implementan solo 1 (Administrador) y 2 (Usuario), pero el código será genérico |
| 6 | Estados como `VARCHAR` libre sin lista oficial | Valores con distinta escritura rompen filtros | Cerrar listas: Producto (Disponible/Agotado), Marca (Activo/Inactivo), Cita (Programada/Completada/Cancelada), Pedido (en ejemplos: Procesando, En Tránsito, Entregado; falta definir inicial y cancelado) |
| 7 | Nombres de entidad: `Categorias` vs `Categoria`; `Entregas` y `Notificaciones` en plural; `pqr` en minúscula | Confusión al crear tablas y archivos | Convención: singular en PascalCase |
| 8 | Ninguna hoja indica qué campos son obligatorios (solo `fecha_fin` menciona NULL) | Errores de "campo no puede ser nulo" al insertar | Agregar la columna "Nulo" a cada hoja |
| 9 | `Cita` guarda `hora_inicio` y `hora_fin` y además `id_horario` | Posible duplicación de horas | Confirmar con la hoja `Horario` |
| 10 | `Pedido.total`, `Cita.total` y `subtotal` son derivados | Totales que no cuadran | Se calculan, no se digitan |
| 11 | El registro pide país y ciudad, pero `Pedido` exige `direccion_entrega` completa | Pedidos sin dirección | El checkout pide la dirección. Confirmar si `Usuario` trae una |
| 12 | `Pedido` no tiene campo de costo de envío, aunque existen "Envío Estándar" y "Envío Express" | No se sabe si el total incluye envío | Confirmar. Mientras tanto, `total` = suma de subtotales |

### 2.4 Reglas para que enlazar la base de datos no genere errores

1. **IDs numéricos autoincrementales.** Nunca strings ni `Date.now()`.
2. **Campos idénticos al diccionario** (snake_case minúscula).
3. **Tipos exactos.** `DECIMAL` → `number` (ojo: el driver `mysql2` devuelve `DECIMAL` como string, así que se convierte con `Number()` en la capa de datos). `TINYINT` → `0 | 1`. Fechas como texto en el formato del diccionario.
4. **Todo acceso a datos por repositorios `async`** con las mismas firmas que tendrá la API.
5. **Integridad simulada:** validar claves foráneas, bloquear borrados con dependientes, preferir `estado = Inactivo`, validar campos UNIQUE.
6. **Orden de carga** (por dependencias): `Rol → Usuario → Categoria → Marca → Proveedor → Servicio → Horario → Producto → DetalleProducto → ProductoProveedor → RolUsuario → Carrito → Pedido → Cita → DetalleCarrito → DetallePedido → DetalleCita → Entregas → Notificaciones → pqr`.
7. **Operaciones compuestas todo-o-nada** (crear pedido, cambiar precio, agendar cita) en una función de servicio; luego serán transacciones SQL.
8. **Derivados calculados** y **precio copiado** en el momento de la compra o reserva.
9. **Tamaños:** los `maxLength` de los formularios coinciden con el diccionario (evita "Data too long").
10. **Versión del almacén y migraciones** (`cosmeticlab_db_version`) más un botón de administrador "Restablecer datos de ejemplo".
11. **Imágenes** en `public/assets/...` con placeholder en `onError`.
12. **Variables de entorno:** `VITE_USE_API` y `VITE_API_URL` para alternar entre localStorage y API.

---

## 3. Cobertura del diccionario (20 entidades originales)

| # | Entidad | Diccionario | Código hoy | Administrador | Usuario | Fase |
|---|---|---|---|---|---|---|
| 1 | Rol | Falta captura | Sin empezar | Gestiona roles | — | 1 |
| 2 | Usuario | Falta captura | Parcial (registro y login) | Lista, inactiva, asigna roles | Edita su perfil | 1 |
| 3 | Categoria | Visto (20 filas) | Parcial (texto fijo) | CRUD | Filtra el catálogo | 2 |
| 4 | DetalleProducto | Visto | Parcial (precio e imagen) | CRUD e historial de precios, alerta de stock | Ve el precio vigente | 2 |
| 5 | RolUsuario | Visto | Sin empezar | Asigna roles | — | 1 |
| 6 | Marca | Visto | Sin empezar | CRUD (estado) | Filtra y ve | 2 |
| 7 | Producto | Visto | Parcial (6 de ejemplo) | CRUD, destacar | Ve y compra | 2 |
| 8 | Proveedor | Visto | Sin empezar | CRUD | — | 5 |
| 9 | ProductoProveedor | Visto | Sin empezar | CRUD | — | 5 |
| 10 | Pedido | Visto | Sin empezar | Gestiona estados | Crea y consulta | 3 |
| 11 | DetallePedido | Falta captura | Sin empezar | Ve | Ve | 3 |
| 12 | Entregas | Falta captura | Sin empezar | Gestiona envíos | Hace seguimiento | 4 |
| 13 | Carrito | Falta captura | Parcial (en memoria) | — | Usa | 3 |
| 14 | DetalleCarrito | Falta captura | Parcial (sin cantidad) | — | Usa | 3 |
| 15 | Notificaciones | Falta captura | Sin empezar | Envía | Recibe | 4 |
| 16 | pqr | Falta captura | Sin empezar | Responde | Crea | 7 |
| 17 | Horario | Falta captura | Sin empezar | CRUD | Ve disponibilidad | 6 |
| 18 | Servicio | Falta captura | Sin empezar | CRUD | Ve | 6 |
| 19 | Cita | Visto | Sin empezar | Gestiona | Agenda y cancela | 6 |
| 20 | DetalleCita | Visto | Sin empezar | Ve | Ve | 6 |
| 21 | Maquilladora | Extensión autorizada; falta captura formal | Parcial | Gestiona perfil y foto | Selecciona para la cita | 6 |

**Capturas que faltan:** Rol, Usuario, DetallePedido, Entregas, Carrito, DetalleCarrito, Notificaciones, pqr, Horario y Servicio.

---

## 4. Modelo de datos (copiar a `src/types/modelos.ts`)

Solo incluye lo que se ve en las capturas. No se inventó nada: lo que falta está marcado.

**Extensión autorizada para citas:** se agregó `Maquilladora` con `id_maquilladora`, `nombre`, `imagen` y `estado`, y una relación `Cita.id_maquilladora`. Falta confirmar estos campos, sus tipos/tamaños SQL y el mecanismo de carga de imágenes al definir el diccionario/API. En el prototipo la imagen se guarda localmente como ruta o Data URL.

```ts
// src/types/modelos.ts
// Nombres de campo IDÉNTICOS al diccionario de datos. No renombrar ni pasar a camelCase.

export type SqlDate = string;     // 'YYYY-MM-DD'
export type SqlTime = string;     // 'HH:mm:ss'
export type SqlDateTime = string; // 'YYYY-MM-DD HH:mm:ss'

export const ESTADOS_PRODUCTO = ['Disponible', 'Agotado'] as const;
export const ESTADOS_MARCA = ['Activo', 'Inactivo'] as const;
export const ESTADOS_PEDIDO = ['Procesando', 'En Tránsito', 'Entregado'] as const; // TODO(confirmar): lista completa (¿Cancelado?)
export const ESTADOS_CITA = ['Programada', 'Completada', 'Cancelada'] as const;
export const METODOS_PAGO = [
  'PSE - Bancolombia', 'PSE - Davivienda', 'PSE - Banco de Bogotá',
  'Tarjeta de Crédito', 'Tarjeta de Débito', 'Nequi', 'Daviplata',
] as const; // los que aparecen en los datos de ejemplo
export const MODALIDADES_ENTREGA = ['Envío Estándar', 'Envío Express'] as const;

export type EstadoProducto = typeof ESTADOS_PRODUCTO[number];
export type EstadoMarca = typeof ESTADOS_MARCA[number];
export type EstadoPedido = typeof ESTADOS_PEDIDO[number];
export type EstadoCita = typeof ESTADOS_CITA[number];

// --- PROVISIONAL: falta la captura del diccionario de Rol ---
export interface Rol {
  id_rol: number;
  nombre: string;
  descripcion: string;
}

export interface RolUsuario {
  id_rol_usuario: number;   // PK (en la hoja: id_RolUsuario)
  id_rol: number;           // FK -> Rol
  id_usuario: number;       // FK -> Usuario
}

export interface Categoria {
  id_categoria: number;     // PK
  nombre: string;           // VARCHAR(100) UNIQUE
  descripcion: string;      // VARCHAR(255)
}

export interface Marca {
  id_marca: number;         // PK
  nombre: string;           // VARCHAR(100) UNIQUE
  descripcion: string;      // TEXT
  logo: string;             // VARCHAR(255) ruta
  estado: EstadoMarca;      // VARCHAR(20)
}

export interface Producto {
  id_producto: number;      // PK
  nombre: string;           // VARCHAR(150)
  descripcion: string;      // TEXT
  precio: number;           // DECIMAL(10,2) — espejo del DetalleProducto vigente
  stock: number;            // INT — espejo del DetalleProducto vigente
  imagen: string;           // VARCHAR(255)
  estado: EstadoProducto;   // VARCHAR(20) — 'Agotado' cuando stock = 0
  destacado: 0 | 1;         // TINYINT
  fecha_registro: SqlDateTime;
  id_categoria: number;     // FK -> Categoria
  id_marca: number;         // FK -> Marca
}

export interface DetalleProducto {
  id_detalle_producto: number; // PK (en la hoja: id_DetalleProducto)
  id_producto: number;         // FK -> Producto
  costo: number;               // DECIMAL(10,2)
  precio_venta: number;        // DECIMAL(10,2)
  stock: number;               // INT
  stock_minimo: number;        // INT — umbral de alerta
  imagen: string;              // VARCHAR(255)
  fecha_ini: SqlDateTime;
  fecha_fin: SqlDateTime | null; // NULL si es vigente
}

export interface Proveedor {
  id_proveedor: number;     // PK
  nombre: string;           // VARCHAR(150)
  telefono: string;         // VARCHAR(20)
  correo: string;           // VARCHAR(150)
  direccion: string;        // VARCHAR(255)
}

export interface ProductoProveedor {
  id_producto_proveedor: number; // PK (en la hoja: id_ProductoProveedor)
  id_producto: number;           // FK
  id_proveedor: number;          // FK
  precio_compra: number;         // DECIMAL(10,2)
}

export interface Pedido {
  id_pedido: number;             // PK
  id_usuario: number;            // FK -> Usuario
  fecha_pedido: SqlDateTime;
  estado: EstadoPedido;          // VARCHAR(50)
  total: number;                 // DECIMAL(10,2) — calculado
  observaciones: string | null;  // TEXT
  fecha_actualizacion: SqlDateTime;
  metodo_pago: string;           // VARCHAR(50)
  comprobante_pago: string | null; // VARCHAR(255) ruta
  modalidad_entrega: string;     // VARCHAR(50)
  direccion_entrega: string;     // VARCHAR(255)
}

export interface Cita {
  id_cita: number;               // PK
  id_usuario: number;            // FK -> Usuario
  fecha: SqlDate;
  hora_inicio: SqlTime;
  hora_fin: SqlTime;
  ubicacion: string;             // VARCHAR(255) (en la hoja: Ubicacion)
  estado: EstadoCita;            // VARCHAR(50)
  observaciones: string | null;  // TEXT
  fecha_solicitud: SqlDateTime;
  id_horario: number;            // FK -> Horario
  total: number;                 // DECIMAL(10,2) — calculado
  monto_anticipo: number | null; // DECIMAL(10,2)
  comprobante_anticipo: string | null; // VARCHAR(255) ruta
}

export interface DetalleCita {
  id_detalle_cita: number;       // PK (en la hoja: id_DetalleCita)
  id_servicio: number;           // FK -> Servicio
  id_cita: number;               // FK -> Cita
  cantidad_personas: number;     // INT (en la hoja: Cantidad_personas)
  precio_unitario: number;       // DECIMAL(10,2) — copiado al reservar
  subtotal: number;              // DECIMAL(10,2) — calculado
}

// Vista para la tienda (no es una tabla)
export interface ProductoVista extends Producto {
  categoria_nombre: string;
  marca_nombre: string;
  detalle_vigente: DetalleProducto | null;
}
```

**Pendiente de captura:** `Usuario`, `DetallePedido`, `Entregas`, `Carrito`, `DetalleCarrito`, `Notificaciones`, `pqr`, `Horario`, `Servicio`. Hasta tenerlas, Copilot no debe crear esos tipos (ver los prompts de cada fase).

---

## 5. Arquitectura de carpetas

```
src/
  types/modelos.ts
  utils/formato.ts                  formatearMoneda, formatearFecha, ahoraSQL
  data/
    almacen.ts                      localStorage genérico, siguienteId, versión y migraciones
    semilla.ts                      carga de datos de ejemplo en orden de dependencias
    semillas/<Tabla>.json           generados desde los CSV
    repositorios/
      crearrepositorio.ts           repositorio genérico async
      categoriarepo.ts, marcarepo.ts, productorepo.ts, ...
    servicios/                      operaciones compuestas todo-o-nada
      catalogoservice.ts, pedidoservice.ts, citaservice.ts
    api/                            (vacío por ahora) repositorioApi
  context/
    cosmeticlab.tsx                 existente (carrito e idioma)
    authcosmeticlab.tsx             sesión y roles
  componentes/
    homecosmeticlab.tsx ...         existentes
    navbarcosmeticlab.tsx           movido desde App.tsx
    carritodrawercosmeticlab.tsx    movido desde App.tsx
    rutaprotegidacosmeticlab.tsx
    admin/                          páginas del administrador
    usuario/                        páginas del usuario
  estilos/                          CSS nuevo (admin.css, usuario.css)
scripts/
  csv/                              CSV exportados de Google Sheets
  csv-a-json.mjs
public/assets/products|brands|...   imágenes
```

---

## 6. Rutas por rol

| Ruta | Quién | Contenido | Fase |
|---|---|---|---|
| `/`, `/productos`, `/login`, `/registro` | Público | Existentes (`/productos` pasa a leer de la base) | existen / 2 |
| `/servicios` | Público | Catálogo de servicios estéticos | 6 |
| `/checkout` | Usuario | Finalizar compra | 3 |
| `/mi-cuenta` | Usuario | Perfil | 1 |
| `/mi-cuenta/pedidos` | Usuario | Mis pedidos y seguimiento | 3 |
| `/mi-cuenta/citas` | Usuario | Agendar y cancelar | 6 |
| `/mi-cuenta/notificaciones` | Usuario | Notificaciones | 4 |
| `/mi-cuenta/pqr` | Usuario | Peticiones, quejas y reclamos | 7 |
| `/admin` | Administrador | Dashboard (indicadores) | 1 |
| `/admin/usuarios` | Administrador | Usuarios y roles | 1 |
| `/admin/categorias`, `/admin/marcas`, `/admin/productos` | Administrador | Catálogo | 2 |
| `/admin/pedidos` | Administrador | Gestión de pedidos | 3 |
| `/admin/entregas`, `/admin/notificaciones` | Administrador | Logística y avisos | 4 |
| `/admin/proveedores` | Administrador | Proveedores y precios de compra | 5 |
| `/admin/servicios`, `/admin/horarios`, `/admin/citas` | Administrador | Servicios y agenda | 6 |
| `/admin/pqr` | Administrador | Responder PQR | 7 |

El administrador también puede entrar a `/mi-cuenta` (en los datos de ejemplo, el usuario 1 tiene los roles 1 y 2).

---

## 7. Fases y prompts para Copilot

Orden recomendado: **0 → 1 → 2 → 3 → 4 → 5 → 6 → 7**. Las fases 3 a 7 necesitan las capturas que faltan; en esos prompts hay un espacio para pegar la tabla del diccionario.

### Fase 0 — Cimientos de datos (no cambia nada visible)

Prepara tipos, almacén, repositorios y semillas. Es lo que evita errores al conectar la BD.

```text
FASE 0 — Cimientos de datos. No debe cambiar nada visible en la página.
Lee .github/copilot-instructions.md y docs/GUIA_MAESTRA_COSMETICLAB.md (sección 4).

1. Crea src/types/modelos.ts copiando EXACTAMENTE el bloque de la sección 4 de la guía.
2. Crea src/utils/formato.ts con: formatearMoneda(n:number) en COP sin decimales usando Intl.NumberFormat('es-CO'); formatearFecha(sql:string, idioma:'es'|'en'); ahoraSQL() que devuelve 'YYYY-MM-DD HH:mm:ss' en hora local.
3. Crea src/data/almacen.ts con leerTabla<T>(tabla), escribirTabla<T>(tabla, filas) y siguienteId(tabla, pk) (máximo + 1). Claves 'cosmeticlab_db_<Tabla>'. Todo con try/catch. Incluye 'cosmeticlab_db_version' y una función migrar() vacía por ahora.
4. Crea src/data/repositorios/crearrepositorio.ts: crearRepositorio<T>(tabla, pk, opciones) con listar, obtener, crear, actualizar y eliminar, todas async. Opciones: campos únicos (comparación sin distinguir mayúsculas), claves foráneas a validar y dependientes que bloquean el borrado. Los errores se lanzan como Error con mensaje claro en español.
5. Crea src/data/semilla.ts: cargarSemillas() que, por cada tabla, solo carga src/data/semillas/<Tabla>.json si la tabla aún no existe en localStorage, respetando este orden: Rol, Usuario, Categoria, Marca, Proveedor, Servicio, Horario, Producto, DetalleProducto, ProductoProveedor, RolUsuario, Carrito, Pedido, Cita, DetalleCarrito, DetallePedido, DetalleCita, Entregas, Notificaciones, pqr. Si el JSON no existe, la tabla queda vacía sin lanzar error. Usa import.meta.glob para leer los JSON.
6. Crea scripts/csv-a-json.mjs (Node, sin dependencias externas): lee scripts/csv/<Tabla>.csv y escribe src/data/semillas/<Tabla>.json. Normaliza los encabezados a minúsculas y aplica estos alias: id_detalleproducto->id_detalle_producto, id_rolusuario->id_rol_usuario, id_productoproveedor->id_producto_proveedor, id_detallecita->id_detalle_cita, cantidad_personas, ubicacion. Convierte tipos según modelos.ts: INT y DECIMAL a number, vacío o NULL a null, TINYINT a 0|1. Agrega el script "semillas" en package.json.
7. En main.tsx llama a cargarSemillas() una sola vez antes de render (cambio mínimo).
8. index.html: lang="es". En el logo de la navbar agrega translate="no".
9. Ejecuta npm run build y corrige errores. Entrega la lista de archivos creados y modificados.
```

**Cómo probar:** la página se ve igual que antes; en DevTools → Application → Local Storage aparecen las claves `cosmeticlab_db_*`.

**Antes de pasar a la Fase 2:** exporta cada hoja de Google Sheets (pestaña con los datos de ejemplo) a CSV y guárdala en `scripts/csv/` con el nombre exacto de la entidad (`Categoria.csv`, `Marca.csv`, `Producto.csv`, …). Luego ejecuta `npm run semillas`.

---

### Fase 1 — Roles, sesión y paneles (Rol, Usuario, RolUsuario)

> **Este prompt reemplaza al de la Fase 1 del mensaje anterior.** Aquella versión usaba IDs de texto y `localStorage` directo; el diccionario exige `INT`.

```text
FASE 1 — Roles, sesión y paneles base. Requiere la Fase 0.
Lee .github/copilot-instructions.md y docs/GUIA_MAESTRA_COSMETICLAB.md.

1. En modelos.ts el tipo Rol es PROVISIONAL (falta el diccionario). Semilla de roles: 1 Administrador, 2 Usuario. El código debe ser genérico para soportar más roles (en los datos de ejemplo existen id_rol del 1 al 5).
2. Migración de usuarios (almacen.ts, migrar()): la clave 'cosmeticlab_users' sigue siendo la tabla Usuario. Cambia RegisteredUser.id de string a number. Los usuarios existentes con id de texto se convierten a números autoincrementales conservando TODOS los demás campos y credenciales. Actualiza registrocosmeticlab.tsx solo donde se genera el id (usar siguienteId). Conserva los exports RegisteredUser y USERS_STORAGE_KEY. Sube cosmeticlab_db_version.
3. Tabla RolUsuario {id_rol_usuario, id_rol, id_usuario}. Al registrarse se crea una fila con id_rol = 2. Un usuario sin fila en RolUsuario se trata como rol Usuario (no migrar). Semilla: usuario administrador (firstName 'Administrador', admin@cosmeticlab.com, contraseña Admin123*) con RolUsuario 1 y 2.
4. Crea src/context/authcosmeticlab.tsx: AuthProvider y useAuth() con currentUser, roles, isAdmin, login(email, password): Promise<{ok:boolean; error?:string}>, logout(). La sesión se guarda en 'cosmeticlab_session' (solo id_usuario). El correo se compara sin distinguir mayúsculas. Marca las contraseñas en texto plano con TODO(backend): hash.
5. Crea componentes/rutaprotegidacosmeticlab.tsx: <RutaProtegida roles={[1]}> redirige a /login si no hay sesión y a / si falta el rol.
6. Mueve NavBar y CartDrawer de App.tsx a componentes/navbarcosmeticlab.tsx y componentes/carritodrawercosmeticlab.tsx SIN cambiar comportamiento, clases ni textos. App.tsx queda solo con providers y rutas.
7. Crea layouts con <Outlet />: componentes/admin/adminlayoutcosmeticlab.tsx (menú lateral) y componentes/usuario/usuariolayoutcosmeticlab.tsx. Páginas: /admin (dashboard con contadores de usuarios por ahora), /admin/usuarios (lista de usuarios con eliminar y asignar o quitar rol; se mueve aquí la sección "Registros guardados"), /mi-cuenta (ver y editar nombre, teléfono, país y ciudad).
8. Login: tras iniciar sesión navega a /admin si isAdmin, o a /mi-cuenta si no. Conserva mensajes, estilos y el estado que llega desde el registro.
9. Registro: elimina la sección "Registros guardados" (ya está en el admin). La página de registro no debe mostrar datos de otros usuarios.
10. NavBar: con sesión muestra "Panel" (administrador) o "Mi cuenta", más "Cerrar sesión". Sin sesión deja "Iniciar sesión" exactamente igual.
11. Estilos nuevos en src/estilos/admin.css y usuario.css. Ejecuta npm run build y entrega la lista de archivos creados y modificados.
```

**Cómo probar**
- Un usuario que ya estaba registrado antes de la fase sigue pudiendo entrar (migración correcta) y llega a `/mi-cuenta`.
- Un usuario nuevo se registra, entra y llega a `/mi-cuenta`.
- `admin@cosmeticlab.com` llega a `/admin`.
- `/admin` sin sesión lleva a `/login`; con un usuario normal lleva a `/`.
- `/registro` ya no muestra la lista de usuarios.

---

### Fase 2 — Catálogo (Categoria, Marca, Producto, DetalleProducto)

```text
FASE 2 — Catálogo. Requiere las Fases 0 y 1 y los CSV de Categoria, Marca, Producto y DetalleProducto cargados (npm run semillas).
Lee .github/copilot-instructions.md y docs/GUIA_MAESTRA_COSMETICLAB.md.

1. Repositorios: categoriarepo, marcarepo, productorepo, detalleproductorepo. Reglas: Categoria.nombre y Marca.nombre únicos; no borrar una Categoria o Marca con productos (mensaje claro); la Marca se inactiva en vez de borrarse; Producto valida id_categoria e id_marca.
2. src/data/servicios/catalogoservice.ts:
   - obtenerCatalogo(): Promise<ProductoVista[]> con nombre de categoría, nombre de marca y detalle_vigente (fecha_ini <= ahora y (fecha_fin null o >= ahora)).
   - El precio y el stock que se muestran salen del detalle vigente; si no hay vigente, usa Producto.precio y avisa "sin precio vigente" solo en el admin.
   - cambiarPrecio(id_producto, {costo, precio_venta, stock_minimo}): cierra el detalle vigente (fecha_fin = ahora), crea uno nuevo con fecha_fin null y sincroniza Producto.precio. Todo-o-nada.
   - ajustarStock(id_producto, delta): actualiza el detalle vigente y Producto.stock; estado 'Agotado' si stock = 0 y 'Disponible' si > 0. Nunca permite stock negativo.
3. productoscosmeticlab.tsx (misma ubicación y mismo diseño: .productos-container, .sidebar, .product-card, .grid-productos): lee de obtenerCatalogo(). El sidebar muestra "Todos" + las categorías de la base (filtra por id_categoria); agrega un select de marca (solo marcas Activo); orden: Destacados (destacado = 1 primero), precio menor y precio mayor. Si el producto está Agotado, muestra la etiqueta y deshabilita el botón "+". Precios con formatearMoneda(). Conserva el export mockProducts marcado @deprecated y sin usar.
4. El contexto del carrito (cosmeticlab.tsx) sigue usando su tipo Product. Crea un adaptador aItemCarrito(productoVista) para no romperlo en esta fase.
5. Crea el componente ImagenProducto con onError que muestra un placeholder (no depende de que existan los archivos de /assets).
6. Admin: /admin/categorias, /admin/marcas y /admin/productos (tabla + formulario de crear y editar con TODOS los campos del diccionario, maxLength según los comentarios de modelos.ts, destacado como casilla). Dentro de producto, pestaña "Historial de precios" que lista sus DetalleProducto.
7. Dashboard: tarjeta "Stock bajo" (stock <= stock_minimo) y tarjeta "Vigencias por vencer" (fecha_fin en menos de 30 días), ambas con enlace al producto.
8. npm run build y lista de archivos creados y modificados.
```

**Cómo probar**
- `/productos` muestra el catálogo de la base con precios en COP y el filtro por categoría con las 20 categorías.
- En los datos de ejemplo, el detalle 10 (`the_ordinary_niacinamide`) tiene stock 4 y mínimo 10, así que debe aparecer en "Stock bajo".
- Cambiar el precio de un producto en el admin crea una fila nueva en el historial y deja la anterior cerrada.
- Intentar borrar una categoría con productos muestra un mensaje y no la borra.

---

### Fase 3 — Compra (Carrito, DetalleCarrito, Pedido, DetallePedido)

**Antes de empezar, pásame** las capturas de `Carrito`, `DetalleCarrito` y `DetallePedido`, y confirma si el total del pedido incluye envío. Pega esas tablas donde indica el prompt.

```text
FASE 3 — Compra. Requiere Fases 0, 1 y 2.
Lee .github/copilot-instructions.md y docs/GUIA_MAESTRA_COSMETICLAB.md.

DICCIONARIO DE Carrito, DetalleCarrito y DetallePedido (usar solo estos campos, no inventar):
[PEGAR AQUÍ LAS TABLAS DE LAS 3 HOJAS]

1. Agrega a modelos.ts los tipos Carrito, DetalleCarrito y DetallePedido con los campos exactos pegados arriba.
2. Carrito: usuario sin sesión → carrito en memoria (como hoy). Con sesión → se guarda en Carrito y DetalleCarrito; al iniciar sesión se fusiona el carrito en memoria con el guardado. Los ítems tienen cantidad (botones + y −). El drawer actual conserva su aspecto; muestra la cantidad por ítem.
3. src/data/servicios/pedidoservice.ts → crearPedido(id_usuario, items, datosEntrega): función todo-o-nada. Primero valida existencia, estado y stock de cada producto y calcula todo; solo después escribe: Pedido (estado inicial 'Procesando', total = suma de subtotales), DetallePedido (precio_unitario copiado del precio vigente, subtotal = precio × cantidad), descuento de stock con ajustarStock y vaciado del carrito. Si algo falla no se escribe nada.
4. Ruta /checkout (solo usuarios con sesión; si no hay, lleva a /login y regresa): resumen, dirección de entrega (texto), modalidad (MODALIDADES_ENTREGA), método de pago (METODOS_PAGO), observaciones y comprobante (guardar solo el nombre del archivo, NUNCA el archivo en localStorage). El botón "Finalizar compra" del drawer lleva a /checkout.
5. Usuario: /mi-cuenta/pedidos (lista con estado y detalle de cada pedido). Admin: /admin/pedidos (filtro por estado, ver detalle, cambiar estado y actualizar fecha_actualizacion).
6. No agregues costo de envío (no existe en el diccionario). Deja TODO(confirmar) si hace falta.
7. npm run build y lista de archivos creados y modificados.
```

**Cómo probar:** comprar con un usuario → el stock baja, el pedido aparece en "Mis pedidos" y en el admin; un producto con stock 1 no se puede comprar dos veces; cambiar el estado en el admin se refleja en la vista del usuario.

---

### Fase 4 — Entregas y Notificaciones

**Antes de empezar, pásame** las capturas de `Entregas` y `Notificaciones`.

```text
FASE 4 — Entregas y Notificaciones. Requiere Fase 3.
DICCIONARIO DE Entregas y Notificaciones (usar solo estos campos):
[PEGAR AQUÍ LAS TABLAS]

1. Agrega los tipos a modelos.ts, sus repositorios y datos semilla si existen.
2. Entregas: al pasar un Pedido a 'En Tránsito' el admin registra o actualiza la entrega (/admin/entregas). El usuario ve el seguimiento dentro del detalle de su pedido.
3. Notificaciones: se generan automáticamente al crear un pedido y al cambiar su estado (desde pedidoservice). El admin puede enviar una notificación manual (/admin/notificaciones). El usuario las ve en /mi-cuenta/notificaciones y en la navbar hay un contador de no leídas (solo si el diccionario tiene un campo para eso).
4. npm run build y lista de archivos.
```

---

### Fase 5 — Proveedores (Proveedor, ProductoProveedor)

```text
FASE 5 — Proveedores. Requiere Fase 2.
Usa los tipos Proveedor y ProductoProveedor de modelos.ts.

1. Repositorios con validación de FK (id_producto, id_proveedor).
2. /admin/proveedores: CRUD de proveedores (validar correo y teléfono). No se puede borrar un proveedor con productos asociados.
3. En el formulario de producto (admin), sección "Proveedores": agregar y quitar relaciones ProductoProveedor con precio_compra. Al cambiar el precio de un producto, si hay proveedor, proponer el costo desde su precio_compra (editable).
4. npm run build y lista de archivos.
```

---

### Fase 6 — Servicios y citas (Servicio, Horario, Cita, DetalleCita)

Los diccionarios de `Servicio` y `Horario` ya fueron recibidos. El módulo usa los campos de esas entidades y `Cita`/`DetalleCita`; confirma el servicio y el horario antes de guardar cada cita.

- Ruta protegida `/citas` para usuarios autenticados: servicio, cantidad de personas, fecha, bloque disponible y sede; muestra el precio y las citas propias.
- La disponibilidad requiere que el servicio esté activo, el horario corresponda al día y esté disponible/activo, que la duración quepa en el bloque y que no exista otra cita programada solapada en esa fecha.
- `citasService.ts` guarda `Cita` y `DetalleCita` de forma atómica, copiando el precio vigente del servicio al detalle.
- `/admin/citas` permite administrar servicios y horarios, filtrar citas por estado/fecha y cancelar las programadas.
- Las tablas vacías de catálogo y agendamiento se pueden completar desde sus semillas CSV, sin sobrescribir datos locales no vacíos.

---

### Fase 7 — PQR

**Antes de empezar, pásame** la captura de `pqr`.

```text
FASE 7 — PQR. Requiere Fase 1.
DICCIONARIO DE pqr (usar solo estos campos):
[PEGAR AQUÍ LA TABLA]

1. Agrega el tipo y el repositorio (nombre de entidad: Pqr en código, tabla pqr).
2. Usuario: /mi-cuenta/pqr para crear y consultar sus PQR. Admin: /admin/pqr para ver, filtrar y responder.
3. El formulario de contacto del Home sigue siendo informativo; no lo modifiques.
4. npm run build y lista de archivos.
```

---

## 8. Conexión a la base de datos (cuando termines las fases)

Los tipos del diccionario (`INT(11)`, `VARCHAR`, `TINYINT`, `DATETIME`, `TEXT`) corresponden a MySQL o MariaDB.

1. **Corregir el diccionario:** los 6 renombres de la sección 2.3, columna "Nulo" y listas cerradas de estados.
2. **Crear el esquema (DDL)** en el orden de la regla 6 (sección 2.4) con claves foráneas, UNIQUE, `ENUM` o `CHECK` para estados, y `DEFAULT CURRENT_TIMESTAMP` en `fecha_registro`. Puedo generártelo cuando tengamos las 20 hojas.
3. **API REST** (Node + Express): un recurso por tabla y endpoints compuestos que usan transacciones (`crearPedido`, `cambiarPrecio`, `agendarCita`).
4. **En el front:** crear `repositorioApi` con la misma interfaz que `crearRepositorio` y alternar con `VITE_USE_API=true` y `VITE_API_URL`. Los componentes no se tocan.
5. **Cuidados:** `DECIMAL` llega como string (convertir con `Number()`); el front no envía el `id` al crear (lo asigna la BD); fechas sin zona horaria; las imágenes se suben al servidor (`multer`) y se guarda solo la ruta.
6. **Seguridad real:** contraseñas con `bcrypt`, sesión con JWT con el rol dentro del token, validación de rol en el servidor (los guards del front son solo experiencia de usuario), CORS restringido, y nunca devolver `password` en las respuestas.
7. **Carga inicial:** reutilizar los mismos CSV como datos semilla.

---

## 9. Registro de avance

Actualízalo al terminar cada fase (o pásamelo y lo actualizo yo).

**Avance del prototipo:** Fases 0, 1, 2 y el módulo de agendamiento de la Fase 6 implementados. El catálogo oficial de Categoria, Marca, Producto y DetalleProducto se importó desde los CSV compartidos. Agendamiento incluye reserva transaccional, disponibilidad sin solapamientos y panel administrativo; faltan los archivos Servicio.csv y Horario.csv para cargar sus filas oficiales (también se pueden configurar desde el administrador).

| # | Entidad | Diccionario | Tipos | Repositorio | Admin | Usuario | Estado |
|---|---|---|---|---|---|---|---|
| 1 | Rol | ☑ | ☐ | ☑ | ☑ | — | Parcial - Fase 1 (tipo provisional) |
| 2 | Usuario | ☑ | ☐ | ☑ | ☑ | ☑ | Parcial - Fase 1 (tipo heredado) |
| 3 | Categoria | ☑ | ☑ | ☑ | ☑ | ☑ | Fase 2 |
| 4 | DetalleProducto | ☑ | ☑ | ☑ | ☑ | ☑ | Fase 2 |
| 5 | RolUsuario | ☑ | ☑ | ☑ | ☑ | — | Fase 1 |
| 6 | Marca | ☑ | ☑ | ☑ | ☑ | ☑ | Fase 2 |
| 7 | Producto | ☑ | ☑ | ☑ | ☑ | ☑ | Fase 2 |
| 8 | Proveedor | ☑ | ☐ | ☐ | ☐ | — | Sin empezar |
| 9 | ProductoProveedor | ☑ | ☐ | ☐ | ☐ | — | Sin empezar |
| 10 | Pedido | ☑ | ☐ | ☐ | ☐ | ☐ | Sin empezar |
| 11 | DetallePedido | ☑ | ☐ | ☐ | ☐ | ☐ | Captura recibida |
| 12 | Entregas | ☑ | ☐ | ☐ | ☐ | ☐ | Captura recibida |
| 13 | Carrito | ☑ | ☐ | ☐ | — | ☐ | Captura recibida |
| 14 | DetalleCarrito | ☑ | ☐ | ☐ | — | ☐ | Captura recibida |
| 15 | Notificaciones | ☑ | ☐ | ☐ | ☐ | ☐ | Captura recibida |
| 16 | pqr | ☑ | ☐ | ☐ | ☐ | ☐ | Captura recibida |
| 17 | Horario | ☑ | ☑ | ☑ | ☑ | ☑ | Fase 6 - pendiente importar CSV oficial |
| 18 | Servicio | ☑ | ☑ | ☑ | ☑ | ☑ | Fase 6 - pendiente importar CSV oficial |
| 19 | Cita | ☑ | ☑ | ☑ | ☑ | ☑ | Fase 6 |
| 20 | DetalleCita | ☑ | ☑ | ☑ | ☑ | ☑ | Fase 6 |

---

## 10. Pendientes de tu parte

**Citas:** `Moda`, `Social` y `Novia` se cargan inactivos hasta definir precio y duración. No se inventaron días ni horas: el administrador configura los bloques en `/admin/citas`.

**Decisiones a confirmar:**
1. ¿Cómo se llaman los roles 3, 4 y 5? ¿Los usará la página o solo el administrador y el usuario?
2. ¿Qué estados puede tener un `Pedido` además de Procesando, En Tránsito y Entregado? ¿Cuál es el estado inicial y existe Cancelado?
3. ¿El total del pedido incluye el envío? ¿"Envío Express" cuesta distinto?
4. ¿Estás de acuerdo con los 6 renombres de campos de la sección 2.3?
5. ¿Los 6 productos inventados del prototipo se reemplazan por los del diccionario?

**Archivos:** exportar a CSV las hojas de datos de ejemplo de las 20 entidades originales.
