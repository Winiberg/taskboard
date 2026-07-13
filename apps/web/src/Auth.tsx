import { useState } from 'react';
import { api } from './api';
import { setTokens } from './authStorage';

interface AuthProps {
  onLogged: () => void;
}

export default function Auth({ onLogged }: AuthProps) {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('secret12');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    
    try {
      const url = mode === 'login' ? '/auth/login' : '/auth/signup';
      const { data } = await api.post(url, { email, password });
      
      // Guarda ambos tokens usando nuestro authStorage centralizado
      setTokens(data.access_token, data.refresh_token);
      // Notifica al componente padre que el usuario ya está autenticado
      onLogged();
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? 'Ocurrió un error en la autenticación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          padding: '32px 28px',
          borderRadius: 18,
          background: 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(15,23,42,0.96))',
          boxShadow: '0 18px 45px rgba(0,0,0,0.55)',
          border: '1px solid rgba(148,163,184,0.35)',
        }}
      >
        {/* Nombre del Proyecto (Puedes cambiar 'TaskBoard' por el nombre de tu app) */}
        <h1 style={{ margin: '0 0 8px', fontSize: 26, textAlign: 'center' }}>TaskBoard</h1>
        
        <p style={{ margin: '0 0 24px', fontSize: 14, color: '#9ca3af', textAlign: 'center' }}>
          Autentícate para gestionar tus recursos y practicar consumo de APIs protegidas.
        </p>

        <form onSubmit={submit}>
          {/* Campo: Correo Electrónico */}
          <label style={{ display: 'block', fontSize: 13, marginBottom: 6, color: '#e2e8f0', textAlign: 'left' }}>
            Correo electrónico
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nombre@correo.com"
            required
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 999,
              border: '1px solid #4b5563',
              backgroundColor: '#020617',
              color: '#e5e7eb',
              marginBottom: 14,
              outline: 'none',
            }}
          />

          {/* Campo: Contraseña */}
          <label style={{ display: 'block', fontSize: 13, marginBottom: 6, color: '#e2e8f0', textAlign: 'left' }}>
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 999,
              border: '1px solid #4b5563',
              backgroundColor: '#020617',
              color: '#e5e7eb',
              marginBottom: 18,
              outline: 'none',
            }}
          />

          {/* Mensaje de Error en caso de existir */}
          {err && (
            <div 
              style={{ 
                color: '#f87171', 
                backgroundColor: 'rgba(239,68,68,0.1)', 
                padding: '8px 12px', 
                borderRadius: 8, 
                fontSize: 13, 
                marginBottom: 14, 
                textAlign: 'center',
                border: '1px solid rgba(239,68,68,0.2)'
              }}
            >
              {err}
            </div>
          )}

          {/* Botón de Acción Principal */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px 0',
              borderRadius: 999,
              border: 'none',
              background: '#c084fc', // Color púrpura moderno a juego con tus variables globales
              color: '#0f172a',
              fontSize: 14,
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: 12,
              transition: 'background 0.2s',
            }}
          >
            {loading ? 'Procesando…' : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>

          {/* Botón Secundario para Alternar Modos */}
          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            style={{
              width: '100%',
              padding: '8px 0',
              borderRadius: 999,
              border: 'none',
              background: 'transparent',
              color: '#9ca3af',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {mode === 'login'
              ? '¿No tienes cuenta? Regístrate'
              : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}