import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import { useState } from 'react';

type Producto = {
  id_producto: string;
  nombre_producto: string;
  descripcion?: string;
  precio: number;
  stock: number;
};

type ItemCarrito = {
  producto: Producto;
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

const obtenerDatosToken = () => {
  const token = localStorage.getItem('token');
  if (!token) return { role: 'VENDEDOR', email: 'Desconocido' };
  try {
    const payloadBase64 = token.split('.')[1];
    const datosDecodificados = JSON.parse(window.atob(payloadBase64));
    return {
      role: datosDecodificados.role || 'VENDEDOR',
      email: datosDecodificados.email || 'vendedor@empresa.com'
    };
  } catch (e) {
    return { role: 'VENDEDOR', email: 'vendedor@empresa.com' };
  }
};

export default function App() {
  const qc = useQueryClient();
  const { role, email } = obtenerDatosToken();

  // Estados del Carrito e Inventario
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [nombreProducto, setNombreProducto] = useState('');
  const [precioProducto, setPrecioProducto] = useState(0);
  const [stockProducto, setStockProducto] = useState(0);
  const [idProductoEditando, setIdProductoEditando] = useState<string | null>(null);

  // Control de paginación mediante servidor
  const [paginaActual, setPaginaActual] = useState(1);
  const productosPorPagina = 10;

  // --- QUERIES ---
  const { data: respuestaProductos = [], isLoading: cargandoProd, error: errorProd } = useQuery<Producto[]>({
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

  const productos = respuestaProductos;

  const { data: ventas, isLoading: cargandoVentas } = useQuery<Venta[]>({
    queryKey: ['ventas'],
    queryFn: async () => (await api.get('/sales')).data,
  });

  // --- LÓGICA DE CONTROL VISUAL ---
  const indiceInicial = (paginaActual - 1) * productosPorPagina;
  const esUltimaPagina = productos.length < productosPorPagina;

  // --- MUTATIONS ---
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
    mutationFn: async (nuevoProd: any) => (await api.post('/products', nuevoProd)).data,
    onSuccess: () => {
      limpiarFormulario();
      qc.invalidateQueries({ queryKey: ['productos'] });
    }
  });

  const mutationEditarProducto = useMutation({
    mutationFn: async (payload: { id: string; data: any }) => {
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['productos'] }),
  });

  // --- MANEJADORES DE EVENTOS ---
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

  const procesarGuardado = () => {
    if (!nombreProducto.trim() || precioProducto <= 0 || stockProducto < 0) return alert('Campos inválidos.');
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
          alert('No puedes agregar más de lo que hay en stock.');
          return prev;
        }
        return prev.map(item => item.producto.id_producto === producto.id_producto ? { ...item, cantidad: item.cantidad + 1 } : item);
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
      cantidad: item.cantidad
    }));
    mutationVenta.mutate(itemsPayload);
  };

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  if (cargandoProd) return <p style={{ padding: '2rem', textAlign: 'center' }}>Cargando inventario global...</p>;
  if (errorProd) return <p style={{ padding: '2rem', color: 'crimson' }}>Error al conectar con el inventario.</p>;

  const totalBoleta = carrito.reduce((sum, item) => sum + (item.producto.precio * item.cantidad), 0);
  const neto = Math.round(totalBoleta / 1.19);
  const iva = totalBoleta - neto;

  return (
    <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem', fontFamily: 'system-ui' }}>
      
      {/* BARRA DE USUARIO */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f4f4f5', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
        <div>
          <p style={{ margin: 0 }}>Usuario: <strong>{email}</strong></p>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>Rol actual: <span style={{ padding: '2px 6px', borderRadius: '4px', background: role === 'ADMIN' ? '#fee2e2' : '#dbeafe', color: role === 'ADMIN' ? '#991b1b' : '#1e40af', fontWeight: 'bold' }}>{role}</span></p>
        </div>
        <button onClick={cerrarSesion} style={{ padding: '8px 16px', background: '#e4e4e7', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Cerrar Sesión</button>
      </header>

      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Sistema de Inventario y Punto de Venta</h1>

      <div style={{ display: 'grid', gridTemplateColumns: role === 'ADMIN' ? '1fr' : '1fr 380px', gap: '2rem', alignItems: 'start' }}>
        
        {/* INVENTARIO GLOBAL */}
        <section style={{ border: '1px solid #e4e4e7', padding: '1.5rem', borderRadius: '8px' }}>
          <h2>Inventario Disponible (Empresa)</h2>
          <p style={{ color: '#71717a', fontSize: '0.9rem' }}>
            Viendo productos del {indiceInicial + 1} al {indiceInicial + productos.length}
          </p>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e4e4e7', textAlign: 'left' }}>
                <th style={{ padding: '8px' }}>Producto</th>
                <th style={{ padding: '8px' }}>Precio</th>
                <th style={{ padding: '8px' }}>Stock</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((p) => (
                <tr key={p.id_producto} style={{ borderBottom: '1px solid #e4e4e7' }}>
                  <td style={{ padding: '8px' }}><strong>{p.nombre_producto}</strong></td>
                  <td style={{ padding: '8px' }}>${p.precio.toLocaleString()}</td>
                  <td style={{ padding: '8px' }}>
                    <span style={{ color: p.stock === 0 ? 'crimson' : 'inherit', fontWeight: p.stock === 0 ? 'bold' : 'normal' }}>
                      {p.stock} uds
                    </span>
                  </td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>
                    {role === 'ADMIN' ? (
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button onClick={() => activarModoEdicion(p)} style={{ background: '#dbeafe', color: '#1e40af', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Editar</button>
                        <button onClick={() => { if(confirm('¿Eliminar producto?')) mutationEliminarProducto.mutate(p.id_producto) }} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>Eliminar</button>
                      </div>
                    ) : (
                      <button onClick={() => agregarAlCarrito(p)} disabled={p.stock === 0} style={{ background: p.stock === 0 ? '#e4e4e7' : '#22c55e', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: p.stock === 0 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
                        {p.stock === 0 ? 'Agotado' : 'Vender'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* CONTROLES DE PAGINACIÓN */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f4f4f5' }}>
            <button 
              onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
              disabled={paginaActual === 1}
              style={{ padding: '6px 12px', background: '#f4f4f5', border: '1px solid #e4e4e7', borderRadius: '4px', cursor: paginaActual === 1 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
            >
              Anterior
            </button>
            <span style={{ fontSize: '0.95rem', color: '#18181b' }}>
              Página <strong>{paginaActual}</strong>
            </span>
            <button 
              onClick={() => setPaginaActual(prev => prev + 1)}
              disabled={esUltimaPagina}
              style={{ padding: '6px 12px', background: '#f4f4f5', border: '1px solid #e4e4e7', borderRadius: '4px', cursor: esUltimaPagina ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
            >
              Siguiente
            </button>
          </div>

          {/* FORMULARIO ADMIN */}
          {role === 'ADMIN' && (
            <div style={{ marginTop: '2rem', padding: '1rem', background: idProductoEditando ? '#f0fdf4' : '#fafafa', borderRadius: '6px', border: idProductoEditando ? '1px solid #22c55e' : '1px dashed #ccc' }}>
              <h3>{idProductoEditando ? 'Modificar Producto Seleccionado' : 'Agregar Nuevo Producto al Stock'}</h3>
              <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                <input value={nombreProducto} onChange={e => setNombreProducto(e.target.value)} placeholder="Nombre del producto" style={{ flex: 2, padding: '8px' }} />
                <input type="number" value={precioProducto} onChange={e => setPrecioProducto(Number(e.target.value))} placeholder="Precio" style={{ flex: 1, padding: '8px' }} />
                <input type="number" value={stockProducto} onChange={e => setStockProducto(Number(e.target.value))} placeholder="Stock" style={{ flex: 1, padding: '8px' }} />
                <button onClick={procesarGuardado} style={{ background: idProductoEditando ? '#16a34a' : '#2563eb', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>{idProductoEditando ? 'Actualizar' : 'Guardar'}</button>
                {idProductoEditando && <button onClick={limpiarFormulario} style={{ background: '#e4e4e7', color: '#18181b', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>}
              </div>
            </div>
          )}
        </section>

        {/* CAJA VENDEDOR */}
        {role !== 'ADMIN' && (
          <section style={{ border: '2px solid #18181b', padding: '1.5rem', borderRadius: '8px', backgroundColor: '#fff' }}>
            <h2 style={{ marginTop: 0, borderBottom: '2px solid #18181b', paddingBottom: '0.5rem' }}>Caja (Emitir Boleta)</h2>
            {carrito.length === 0 ? (
              <p style={{ color: '#71717a', textAlign: 'center', padding: '2rem 0' }}>El carro está vacío. Selecciona productos del inventario.</p>
            ) : (
              <>
                <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0' }}>
                  {carrito.map((item) => (
                    <li key={item.producto.id_producto} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', fontSize: '0.95rem', borderBottom: '1px solid #f4f4f5' }}>
                      <span style={{ marginRight: '8px' }}>{item.producto.nombre_producto}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f4f4f5', padding: '2px', borderRadius: '4px' }}>
                          <button onClick={() => decrementarCantidad(item.producto.id_producto)} style={{ background: '#e4e4e7', border: 'none', width: '24px', height: '24px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                          <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.9rem' }}>{item.cantidad}</span>
                          <button onClick={() => agregarAlCarrito(item.producto)} style={{ background: '#e4e4e7', border: 'none', width: '24px', height: '24px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                        </div>
                        <span style={{ fontWeight: '500', minWidth: '70px', textAlign: 'right' }}>${(item.producto.precio * item.cantidad).toLocaleString()}</span>
                      </div>
                    </li>
                  ))}
                </ul>
                <div style={{ borderTop: '1px dashed #ccc', paddingTop: '1rem', fontSize: '0.9rem', color: '#52525b' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Neto:</span><span>${neto.toLocaleString()}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}><span>I.V.A 19%:</span><span>${iva.toLocaleString()}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold', color: '#000', borderTop: '1px solid #000', paddingTop: '0.5rem' }}>
                    <span>TOTAL:</span><span>${totalBoleta.toLocaleString()}</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
                  <button 
                    onClick={cancelarVenta}
                    style={{ flex: 1, padding: '12px', background: '#e4e4e7', color: '#18181b', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer' }}
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={procesarVenta} 
                    disabled={mutationVenta.isPending}
                    style={{ flex: 2, padding: '12px', background: '#18181b', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer' }}
                  >
                    {mutationVenta.isPending ? 'Emitiendo...' : 'Confirmar Venta'}
                  </button>
                </div>
              </>
            )}
          </section>
        )}
      </div>

      {/* HISTORIAL DE VENTAS */}
      <section style={{ marginTop: '3rem', border: '1px solid #e4e4e7', padding: '1.5rem', borderRadius: '8px' }}>
        <h2>Historial de Ventas Registradas</h2>
        <p style={{ color: '#71717a', fontSize: '0.9rem' }}>
          {role === 'ADMIN' 
            ? 'Vista de Administrador: Viendo absolutamente todas las boletas de todos los vendedores.' 
            : 'Vista de Vendedor: Solo tienes acceso a tus propios registros de venta.'}
        </p>

        {cargandoVentas ? <p>Cargando historial...</p> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            {ventas?.map((v) => (
              <div key={v.id_venta} style={{ border: '1px solid #cbd5e1', padding: '1rem', borderRadius: '6px', background: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b', marginBottom: '6px' }}>
                  <span>ID: {v.id_venta.substring(0, 8)}...</span>
                  <span>{new Date(v.createdAt).toLocaleDateString()}</span>
                </div>
                {role === 'ADMIN' && v.user && <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#0f172a' }}><strong>Vendedor:</strong> {v.user.name || v.user.email}</p>}
                <div style={{ fontSize: '0.9rem', borderBottom: '1px dashed #ccc', paddingBottom: '6px', marginBottom: '6px' }}>
                  {v.details?.map(d => (
                    <div key={d.id_detalle} style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                      <span>• {d.product?.nombre_producto} (x{d.cantidad})</span>
                      <span>${(d.precio_unitario * d.cantidad).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1rem', marginTop: '8px' }}>
                  <span>Total Boleta:</span>
                  <span style={{ color: '#16a34a' }}>${v.total.toLocaleString()}</span>
                </div>
              </div>
            ))}
            {ventas?.length === 0 && <p style={{ color: '#64748b' }}>No se registran ventas en este periodo.</p>}
          </div>
        )}
      </section>
    </main>
  );
}