import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import { useState } from 'react';

// --- TRADUCCIÓN DE TIPOS Y ESTRUCTURAS ---
type Producto = {
  id_producto: string;
  nombre_producto: string;
  descripcion?: string;
  precio: number;
  stock: number;
};

type ItemCarrito = {
  producto: Producto;
  fancy_name?: string; // Propiedad auxiliar interna para firmas
  cantidad: number;
};

type VentaDetalle = {
  id_detalle: string;
  cantidad: number;
  precio_unitario: number;
  product: Producto;
};

type Venta = {
  id_venta: string;
  total: number;
  createdAt: string;
  user?: { email: string; name: string };
  details: VentaDetalle[];
};

interface TokenData {
  role: 'ADMIN' | 'VENDEDOR';
  email: string;
}

interface AppProps {
  onLogout: () => void;
}

// Extracción segura del payload JWT
const obtenerDatosToken = (): TokenData => {
  const token = localStorage.getItem('access_token') || localStorage.getItem('token');
  if (!token) return { role: 'VENDEDOR', email: 'Desconocido' };
  
  try {
    const payloadBase64 = token.split('.')[1];
    const jsonPayload = decodeURIComponent(
      window.atob(payloadBase64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const datosDecodificados = JSON.parse(jsonPayload);
    
    return {
      role: datosDecodificados.role === 'ADMIN' ? 'ADMIN' : 'VENDEDOR',
      email: datosDecodificados.email || 'vendedor@empresa.com'
    };
  } catch {
    return { role: 'VENDEDOR', email: 'Desconocido' };
  }
};

export default function App({ onLogout }: AppProps) {
  const qc = useQueryClient();
  const { role, email } = obtenerDatosToken();

  // --- ESTADOS LOCALES ---
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [nombreProducto, setNombreProducto] = useState('');
  const [precioProducto, setPrecioProducto] = useState<number>(0);
  const [stockProducto, setStockProducto] = useState<number>(0);
  const [idProductoEditando, setIdProductoEditando] = useState<string | null>(null);
  const [paginaActual, setPaginaActual] = useState(1);

  const productosPorPagina = 10;

  // --- TANSTACK QUERIES ---
  const { data: productos = [], isLoading: cargandoProd, error: errorProd } = useQuery<Producto[]>({
    queryKey: ['productos', paginaActual],
    queryFn: async () => {
      const response = await api.get('/products', {
        params: {
          take: productosPorPagina,
          skip: (paginaActual - 1) * productosPorPagina
        }
      });
      return response.data;
    },
  });

  const { data: ventas = [] } = useQuery<Venta[]>({
    queryKey: ['ventas'],
    queryFn: async () => (await api.get('/sales')).data,
  });

  // --- TANSTACK MUTATIONS ---
  const mutationVenta = useMutation({
    mutationFn: async (itemsFormateados: { id_producto: string; cantidad: number }[]) => {
      return (await api.post('/sales', { items: itemsFormateados })).data;
    },
    onSuccess: () => {
      alert('Venta realizada con éxito. Boleta emitida y stock actualizado.');
      setCarrito([]);
      qc.invalidateQueries({ queryKey: ['productos'] });
      qc.invalidateQueries({ queryKey: ['ventas'] });
    },
    onError: (error: any) => alert(error?.response?.data?.message || 'Error al procesar la venta.')
  });

  const mutationCrearProducto = useMutation({
    mutationFn: async (nuevoProd: Omit<Producto, 'id_producto'>) => 
      (await api.post('/products', nuevoProd)).data,
    onSuccess: () => {
      limpiarFormulario();
      qc.invalidateQueries({ queryKey: ['productos'] });
      alert('Producto creado exitosamente.');
    }
  });

  const mutationEditarProducto = useMutation({
    mutationFn: async (payload: { id: string; data: Omit<Producto, 'id_producto'> }) => {
      return (await api.patch(`/products/${payload.id}`, payload.data)).data;
    },
    onSuccess: () => {
      alert('Producto actualizado con éxito.');
      limpiarFormulario();
      qc.invalidateQueries({ queryKey: ['productos'] });
    }
  });

  const mutationEliminarProducto = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/products/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['productos'] });
      alert('Producto eliminado del sistema.');
    },
  });

  // --- MANEJADORES DE LOGICA ---
  const activarModoEdicion = (producto: Producto) => {
    setIdProductoEditando(producto.id_producto);
    setNombreProducto(producto.nombre_producto);
    setPrecioProducto(producto.precio);
    setStockProducto(producto.stock);
  };

  const limpiarFormulario = () => {
    setIdProductoEditando(null);
    setNombreProducto('');
    setPrecioProducto(0);
    setStockProducto(0);
  };

  const procesarGuardado = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreProducto.trim() || precioProducto <= 0 || stockProducto < 0) {
      return alert('Por favor, ingresa valores válidos.');
    }
    const datos = { nombre_producto: nombreProducto, precio: precioProducto, stock: stockProducto };
    if (idProductoEditando) {
      mutationEditarProducto.mutate({ id: idProductoEditando, data: datos });
    } else {
      mutationCrearProducto.mutate(datos);
    }
  };

  const agregarAlCarrito = (producto: Producto) => {
    if (producto.stock <= 0) return alert('Sin stock disponible.');
    setCarrito((prev) => {
      const existe = prev.find(item => item.producto.id_producto === producto.id_producto);
      if (existe) {
        if (existe.cantidad >= producto.stock) {
          alert('No puedes agregar más unidades de las disponibles en inventario.');
          return prev;
        }
        return prev.map(item => 
          item.producto.id_producto === producto.id_producto 
            ? { ...item, Math_pointer: undefined, cantidad: item.cantidad + 1 } 
            : item
        );
      }
      return [...prev, { producto, cantidad: 1 }];
    });
  };

  const decrementarCantidad = (id_producto: string) => {
    setCarrito((prev) =>
      prev
        .map((item) =>
          item.producto.id_producto === id_producto
            ? { ...item, cantidad: item.cantidad - 1 }
            : item
        )
        .filter((item) => item.cantidad > 0)
    );
  };

  const cancelarVenta = () => {
    if (confirm('¿Está seguro de que desea cancelar la venta actual y vaciar la caja?')) {
      setCarrito([]);
    }
  };

  const procesarVenta = () => {
    const itemsPayload = carrito.map(item => ({
      id_producto: item.producto.id_producto,
      fancy_name: item.producto.nombre_producto,
      cantidad: item.fancy_name ? undefined : item.cantidad
    }));
    const cleanPayload = itemsPayload.map(({ id_producto, cantidad }) => ({ id_producto, cantidad: cantidad ?? 1 }));
    mutationVenta.mutate(cleanPayload);
  };

  const cerrarSesion = () => {
    onLogout();
  };

  if (cargandoProd) return <p style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Cargando inventario global...</p>;
  if (errorProd) return <p style={{ padding: 40, textAlign: 'center', color: '#ef4444' }}>Error al conectar con el inventario.</p>;

  // --- CÁLCULOS FINANCIEROS (Valores basados en IVA 19%) ---
  const totalBoleta = carrito.reduce((sum, item) => sum + (item.producto.precio * item.cantidad), 0);
  const neto = Math.round(totalBoleta / 1.19);
  const iva = totalBoleta - neto;
  const indiceInicial = (paginaActual - 1) * productosPorPagina;
  const esUltimaPagina = productos.length < productosPorPagina;

  return (
    // 🎨 AJUSTE: Cambiado a fondo oscuro total (#0f172a)
    <main style={{ minHeight: '100vh', backgroundColor: '#0f172a', padding: '24px 16px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        
        {/* BARRA DE USUARIO SUPERIOR */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', color: '#0f172a', padding: '16px 24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #1e293b', marginBottom: '24px', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Usuario autenticado</p>
            <p style={{ margin: '2px 0 0', fontWeight: 600, fontSize: '16px' }}>
              {email}
              <span style={{ marginLeft: '10px', padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 'bold', background: role === 'ADMIN' ? '#fee2e2' : '#dbeafe', color: role === 'ADMIN' ? '#991b1b' : '#1e40af' }}>
                {role}
              </span>
            </p>
          </div>
          <button onClick={cerrarSesion} style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, color: '#475569', transition: 'background 0.2s' }}>
            Cerrar Sesión
          </button>
        </header>

        {/* 🎨 AJUSTE: Título cambiado a blanco (#ffffff) para contraste de lectura */}
        <h1 style={{ fontSize: '28px', fontWeight: 800, textAlign: 'center', marginBottom: '32px', color: '#ffffff', letterSpacing: '-0.5px' }}>
          Sistema de Inventario y Punto de Venta
        </h1>

        {/* CONTENEDOR PRINCIPAL */}
        <div style={{ display: 'grid', gridTemplateColumns: role === 'ADMIN' || ('window' in window && window.innerWidth < 1024) ? '1fr' : '1fr 380px', gap: '24px', alignItems: 'start' }}>
          
          {/* SECCIÓN IZQUIERDA: INVENTARIO */}
          <section style={{ backgroundColor: '#ffffff', color: '#0f172a', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <h2 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Inventario de Productos</h2>
            <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 20px' }}>
              Mostrando registros del {indiceInicial + 1} al {indiceInicial + productos.length}
            </p>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left', color: '#64748b' }}>
                    <th style={{ padding: '12px 8px' }}>Producto</th>
                    <th style={{ padding: '12px 8px' }}>Precio Unitario</th>
                    <th style={{ padding: '12px 8px' }}>Stock Actual</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((p) => (
                    <tr key={p.id_producto} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 8px', color: '#0f172a' }}><strong>{p.nombre_producto}</strong></td>
                      <td style={{ padding: '12px 8px', fontWeight: 500, color: '#0f172a' }}>${p.precio.toLocaleString('es-CL')}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, backgroundColor: p.stock === 0 ? '#fef2f2' : '#f0fdf4', color: p.stock === 0 ? '#ef4444' : '#22c55e' }}>
                          {p.stock} uds
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                        {role === 'ADMIN' ? (
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button onClick={() => activarModoEdicion(p)} style={{ background: '#eff6ff', color: '#2563eb', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>Editar</button>
                            <button onClick={() => { if(confirm('¿Eliminar producto de forma permanente?')) mutationEliminarProducto.mutate(p.id_producto) }} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Eliminar</button>
                          </div>
                        ) : (
                          <button onClick={() => agregarAlCarrito(p)} disabled={p.stock === 0} style={{ background: p.stock === 0 ? '#cbd5e1' : '#10b981', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: p.stock === 0 ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '13px' }}>
                            {p.stock === 0 ? 'Agotado' : 'Añadir'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* CONTROLES DE PAGINACIÓN */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
              <button 
                onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                disabled={paginaActual === 1}
                style={{ 
                  padding: '8px 16px', 
                  background: paginaActual === 1 ? '#f1f5f9' : '#ffffff', 
                  color: paginaActual === 1 ? '#94a3b8' : '#0f172a', 
                  border: '1px solid #cbd5e1', 
                  borderRadius: '8px', 
                  cursor: paginaActual === 1 ? 'not-allowed' : 'pointer', 
                  fontWeight: 600, 
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: paginaActual === 1 ? 'none' : '0 1px 2px rgba(0,0,0,0.05)',
                  outline: 'none'
                }}
              >
                <span>←</span> Anterior
              </button>
              
              <span style={{ fontSize: '14px', color: '#475569' }}>
                Página <strong style={{ color: '#0f172a' }}>{paginaActual}</strong>
              </span>
              
              <button 
                onClick={() => setPaginaActual(prev => prev + 1)}
                disabled={esUltimaPagina}
                style={{ 
                  padding: '8px 16px', 
                  background: esUltimaPagina ? '#f1f5f9' : '#ffffff', 
                  color: esUltimaPagina ? '#94a3b8' : '#0f172a', 
                  border: '1px solid #cbd5e1', 
                  borderRadius: '8px', 
                  cursor: esUltimaPagina ? 'not-allowed' : 'pointer', 
                  fontWeight: 600, 
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: esUltimaPagina ? 'none' : '0 1px 2px rgba(0,0,0,0.05)',
                  outline: 'none'
                }}
              >
                Siguiente <span>→</span>
              </button>
            </div>

            {/* FORMULARIO DE GESTIÓN (SOLO ADMINISTRADORES) */}
            {role === 'ADMIN' && (
              <form onSubmit={procesarGuardado} style={{ marginTop: '32px', padding: '20px', background: idProductoEditando ? '#f0fdf4' : '#f8fafc', borderRadius: '12px', border: idProductoEditando ? '1px solid #10b981' : '1px dashed #cbd5e1' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: idProductoEditando ? '#065f46' : '#1e293b' }}>
                  {idProductoEditando ? '📝 Modificar Producto Seleccionado' : '➕ Agregar Nuevo Producto al Stock'}
                </h3>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <input required value={nombreProducto} onChange={e => setNombreProducto(e.target.value)} placeholder="Nombre del producto" style={{ flex: '2 1 200px', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', color: '#0f172a' }} />
                  <input required type="number" min="1" value={precioProducto || ''} onChange={e => setPrecioProducto(Number(e.target.value))} placeholder="Precio ($)" style={{ flex: '1 1 100px', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', color: '#0f172a' }} />
                  <input required type="number" min="0" value={stockProducto || ''} onChange={e => setStockProducto(Number(e.target.value))} placeholder="Stock" style={{ flex: '1 1 100px', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', color: '#0f172a' }} />
                  
                  <div style={{ display: 'flex', gap: '6px', width: '100%', marginTop: '4px', justifyContent: 'flex-end' }}>
                    {idProductoEditando && (
                      <button type="button" onClick={limpiarFormulario} style={{ background: '#e2e8f0', color: '#334155', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                        Cancelar
                      </button>
                    )}
                    <button type="submit" style={{ background: idProductoEditando ? '#10b981' : '#2563eb', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                      {idProductoEditando ? 'Actualizar Producto' : 'Guardar en Sistema'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </section>

          {/* SECCIÓN DERECHA: CAJA PUNTO DE VENTA (SÓLO VENDEDORES) */}
          {role !== 'ADMIN' && (
            <section style={{ backgroundColor: '#ffffff', color: '#0f172a', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <h2 style={{ marginTop: 0, fontSize: '18px', fontWeight: 800, borderBottom: '2px solid #0f172a', paddingBottom: '10px', marginBottom: '16px', color: '#0f172a' }}>
                Caja (Emitir Boleta)
              </h2>
              
              {carrito.length === 0 ? (
                <p style={{ color: '#64748b', textAlign: 'center', padding: '40px 0', fontSize: '14px' }}>
                  El carro está vacío.<br />Selecciona artículos del inventario.
                </p>
              ) : (
                <>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px' }}>
                    {carrito.map((item) => (
                      <li key={item.producto.id_producto} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', fontSize: '14px', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ fontWeight: 500, maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#0f172a' }}>
                          {item.producto.nombre_producto}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#f1f5f9', padding: '2px', borderRadius: '6px' }}>
                            <button onClick={() => decrementarCantidad(item.producto.id_producto)} style={{ background: '#e2e8f0', color: '#0f172a', border: 'none', width: '22px', height: '22px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
                            <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>{item.cantidad}</span>
                            <button onClick={() => agregarAlCarrito(item.producto)} style={{ background: '#e2e8f0', color: '#0f172a', border: 'none', width: '22px', height: '22px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                          </div>
                          <span style={{ fontWeight: 600, minWidth: '70px', textAlign: 'right', color: '#334155' }}>
                            ${(item.producto.precio * item.cantidad).toLocaleString('es-CL')}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {/* DESGLOSE CONTABLE */}
                  <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '12px', fontSize: '13px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Neto:</span><span style={{ fontWeight: 500 }}>${neto.toLocaleString('es-CL')}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span>I.V.A (19%):</span><span style={{ fontWeight: 500 }}>${iva.toLocaleString('es-CL')}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 800, color: '#0f172a', borderTop: '1px solid #0f172a', paddingTop: '8px', marginTop: '4px' }}>
                      <span>TOTAL:</span><span>${totalBoleta.toLocaleString('es-CL')}</span>
                    </div>
                  </div>
                  
                  {/* ACCIONES DE CAJA */}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                    <button onClick={cancelarVenta} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                      Cancelar
                    </button>
                    <button onClick={procesarVenta} disabled={mutationVenta.isPending} style={{ flex: 2, padding: '12px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                      {mutationVenta.isPending ? 'Emitiendo...' : 'Confirmar Venta'}
                    </button>
                  </div>
                </>
              )}
            </section>
          )}
        </div>

        {/* HISTORIAL GENERAL DE BOLETAS EMITIDAS */}
        <section style={{ marginTop: '40px', backgroundColor: '#ffffff', color: '#0f172a', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h2 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Historial de Ventas Registradas</h2>
          <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 20px' }}>
            {role === 'ADMIN' 
              ? 'Vista de Auditoría (Admin): Desplegando el flujo total de cajas y vendedores.' 
              : 'Vista de Rendimiento (Vendedor): Accediendo de forma exclusiva a tus boletas del turno.'}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {ventas.map((v) => (
              <div key={v.id_venta} style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '12px', background: '#f8fafc', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>
                    <span style={{ fontFamily: 'monospace' }}>ID: {v.id_venta.substring(0, 8).toUpperCase()}</span>
                    <span>{new Date(v.createdAt).toLocaleDateString('es-CL')}</span>
                  </div>
                  
                  {role === 'ADMIN' && v.user && (
                    <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#1e293b' }}>
                      <strong>Vendedor:</strong> {v.user.name || v.user.email}
                    </p>
                  )}
                  
                  <div style={{ fontSize: '13px', borderBottom: '1px dashed #e2e8f0', paddingBottom: '8px', marginBottom: '8px' }}>
                    {v.details?.map(d => (
                      <div key={d.id_detalle} style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', margin: '4px 0' }}>
                        <span>• {d.product?.nombre_producto} <span style={{ color: '#94a3b8' }}>x{d.cantidad}</span></span>
                        <span style={{ fontWeight: 500, color: '#0f172a' }}>${(d.precio_unitario * d.cantidad).toLocaleString('es-CL')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '15px', paddingTop: '4px' }}>
                  <span style={{ color: '#64748b' }}>Total Boleta:</span>
                  <span style={{ color: '#10b981' }}>${v.total.toLocaleString('es-CL')}</span>
                </div>
              </div>
            ))}
            
            {ventas.length === 0 && (
              <p style={{ color: '#64748b', fontSize: '14px', gridColumn: '1 / -1', textAlign: 'center', padding: '20px 0' }}>
                No se registran transacciones en este periodo.
              </p>
            )}
          </div>
        </section>

      </div>
    </main>
  );
}