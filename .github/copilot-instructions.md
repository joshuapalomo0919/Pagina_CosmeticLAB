# Instrucciones del proyecto CosmeticLAB (React + Vite + TypeScript)

> Colocar este archivo en `.github/copilot-instructions.md`.
> Guía completa: `docs/GUIA_MAESTRA_COSMETICLAB.md`.

## Contexto
Tienda de cosmética con servicios estéticos. Los datos siguen un diccionario de datos de 20 entidades (modelos exactos en la sección 4 de la guía).
Hoy todo persiste en `localStorage`; más adelante se conectará a una API REST con MySQL. **El código debe poder pasar de localStorage a API sin tocar ningún componente.**

## Reglas generales
1. Los componentes existentes (Home, Productos, Login, Registro, NavBar, CartDrawer) pueden moverse o refactorizarse solo si el comportamiento y la apariencia quedan idénticos. Al terminar, lista qué cambiaste.
2. Convención de nombres: `componentes/<nombre>cosmeticlab.tsx` y `context/<nombre>cosmeticlab.tsx`. Páginas de administrador en `componentes/admin/`, de usuario en `componentes/usuario/`.
3. Conserva los exports actuales: `RegisteredUser`, `USERS_STORAGE_KEY`, `mockProducts` (este último queda como `@deprecated`), `useCosmetic`.
4. Estilos: reutiliza las clases de `App.css`. Los estilos nuevos van en archivos aparte dentro de `src/estilos/`. No modifiques reglas existentes.
5. Todo texto visible debe funcionar en `es` y `en` con `language` de `useCosmetic`. Los datos de la base (nombres de productos, categorías, etc.) no se traducen.
6. TypeScript estricto: sin `any`, sin variables sin usar. Al terminar cada tarea ejecuta `npm run build` y corrige todos los errores.

## Reglas de datos (evitan errores al conectar la base de datos)
7. Todos los tipos viven en `src/types/modelos.ts`. Los nombres de campo son **idénticos al diccionario** (snake_case minúscula, por ejemplo `id_producto`, `fecha_registro`). Nunca los pases a camelCase ni los renombres. Excepción temporal: el tipo heredado `RegisteredUser` (camelCase) hasta recibir el diccionario de Usuario.
8. Tipos: `INT` → `number`. `DECIMAL` → `number`. `TINYINT` → `0 | 1`, nunca `boolean`. `DATETIME` → `'YYYY-MM-DD HH:mm:ss'`. `DATE` → `'YYYY-MM-DD'`. `TIME` → `'HH:mm:ss'`. Campos que admiten vacío → `| null`.
9. Los IDs son numéricos autoincrementales con `siguienteId(tabla)`. Nunca uses `Date.now()` ni strings aleatorios como ID. Al crear, el front no inventa IDs fuera de esa función (la BD los asignará).
10. Ningún componente toca `localStorage` directamente. Todo pasa por `src/data/repositorios/*`, y todas las funciones son `async` (devuelven `Promise`), aunque hoy sean síncronas por dentro.
11. Integridad referencial simulada: valida las claves foráneas al crear y editar. No permitas borrar un registro con dependientes (muestra un mensaje). Para marcas y similares prefiere cambiar el `estado` a Inactivo en vez de borrar. Valida los campos UNIQUE (`Categoria.nombre`, `Marca.nombre`, correo de usuario) sin distinguir mayúsculas.
12. Los `maxLength` de los inputs coinciden con el tamaño del diccionario (están en los comentarios de `modelos.ts`).
13. Las operaciones compuestas (crear pedido, cambiar precio, agendar cita) viven en **una sola función de servicio** todo-o-nada: primero se valida y se calcula todo, y solo después se escribe. Luego será una transacción SQL.
14. Los totales y subtotales se calculan, no se digitan. El `precio_unitario` se copia en el momento de la compra o reserva (no se enlaza al precio vigente).
15. Dinero en COP: usa `formatearMoneda()` (Intl `es-CO`, sin decimales). Nunca `$` + `toFixed(2)`.
16. Imágenes: rutas del diccionario (`/assets/products/x.jpg`) servidas desde `public/assets/`. Usa un componente con `onError` que muestre un placeholder.
17. No inventes campos ni entidades que no estén en el diccionario. Si falta información, deja `// TODO(confirmar): ...` y avísame en el resumen final.
18. Seguridad del prototipo: la protección de rutas en el front es solo experiencia de usuario. Marca las contraseñas en texto plano con `// TODO(backend): hash`.

## Al terminar cada tarea
Entrega: (a) lista de archivos creados, (b) lista de archivos modificados con el motivo, (c) cómo probarlo, (d) los `TODO(confirmar)` que quedaron.
