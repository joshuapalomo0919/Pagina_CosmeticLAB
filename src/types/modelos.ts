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
] as const;
export const MODALIDADES_ENTREGA = ['Envío Estándar', 'Envío Express'] as const;

export type EstadoProducto = typeof ESTADOS_PRODUCTO[number];
export type EstadoMarca = typeof ESTADOS_MARCA[number];
export type EstadoPedido = typeof ESTADOS_PEDIDO[number];
export type EstadoCita = typeof ESTADOS_CITA[number];
export type EstadoServicio = 'Activo' | 'Inactivo';
export type EstadoHorario = 'Disponible' | 'Ocupado';
export type EstadoRegistro = 'Activo' | 'Inactivo';

// Tipo heredado temporal mientras se confirma el diccionario de Usuario.
export interface RegisteredUser {
  id: number;
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  birthDate: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  password: string; // TODO(backend): almacenar solo hashes de contraseñas.
}

// PROVISIONAL: falta la captura del diccionario de Rol.
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

export interface Servicio {
  id_servicio: number;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen: string;
  duracion: string;
  estado: EstadoServicio;
}

export interface Horario {
  id_horario: number;
  dia_semana: string;
  hora_inicio: SqlTime;
  hora_fin: SqlTime;
  estado_disponibilidad: EstadoHorario;
  estado: EstadoRegistro;
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

// Vista para la tienda (no es una tabla).
export interface ProductoVista extends Producto {
  categoria_nombre: string;
  marca_nombre: string;
  detalle_vigente: DetalleProducto | null;
}
