import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App.tsx';
import Auth from './Auth.tsx'; // 1. Importamos el componente de autenticación creado
import './index.css';

// 1. Cliente de React Query para gestionar caché y estado de datos
const qc = new QueryClient();

// Componente guardián que evalúa el estado de la sesión antes de mostrar la aplicación
const RootElement = () => {
  // Revisa si hay un token guardado en el almacenamiento local para definir el estado inicial
  const [logged, setLogged] = useState(!!localStorage.getItem('token'));

  // Si está logueado muestra tu App de Inventario, de lo contrario muestra el Login
  return logged ? <App /> : <Auth onLogged={() => setLogged(true)} />;
};

// 2. Definición del router: vinculamos la ruta raíz '/' a nuestro nuevo RootElement
const router = createBrowserRouter([
  { path: '/', element: <RootElement /> },
]);

// 3. Montaje de la aplicación con los proveedores necesarios
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);
