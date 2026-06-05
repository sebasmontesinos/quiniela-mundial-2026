import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { usingAuthEmulator } from '../firebase/config';

export default function Login() {
  const { currentUser, signInWithGoogle, authError, clearAuthError } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const displayError = error || authError;

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async () => {
    try {
      setError('');
      clearAuthError();
      setLoading(true);
      await signInWithGoogle();
      // En emulador, signInWithRedirect sale de la página; el retorno lo maneja AuthContext.
      if (!usingAuthEmulator) {
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      setError('No se pudo iniciar sesión con Google. Por favor, intentá de nuevo.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-fifa-gradient p-4">
      <div className="w-full max-w-md fifa-card p-8">
        
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🏆</div>
          <h1 className="text-4xl font-extrabold fifa-gold-gradient tracking-tight leading-tight">
            Mundial 2026
          </h1>
          <p className="text-white mt-3 font-medium text-lg">Fixture de la Oficina</p>
          <div className="mt-4 flex justify-center gap-2 text-2xl">
            <span>⚽</span>
            <span>🌍</span>
            <span>⚽</span>
          </div>
        </div>

        {displayError && (
          <div className="bg-fifa-red/20 border border-fifa-red/50 text-fifa-red px-4 py-3 rounded-lg text-sm mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{displayError}</span>
          </div>
        )}

        <div className="space-y-6">
          <p className="text-[#94A3B8] text-center text-sm">
            Iniciá sesión con tu cuenta de Google para participar en el fixture de la oficina.
          </p>
          {usingAuthEmulator && (
            <p className="text-fifa-gold/70 text-center text-xs">
              En modo local serás redirigido al emulador de Auth para elegir una cuenta de prueba.
            </p>
          )}

          <button
            id="btn-google-login"
            onClick={handleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-[#0A0E1A] font-semibold px-6 py-3.5 rounded-xl transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-fifa-gold" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <>
                <svg className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-.1.84-2.45 2.4v1.99h3.94c2.31-2.13 3.65-5.26 3.65-8.24z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.94-1.99c-1.1.75-2.52 1.19-4.02 1.19-3.1 0-5.72-2.11-6.66-4.96H1.28v2.9C3.26 22.25 7.37 24 12 24z" />
                  <path fill="#FBBC05" d="M5.34 15.34a7.17 7.17 0 0 1 0-4.68V7.76H1.28a11.94 11.94 0 0 0 0 8.48l4.06-2.9z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.26 1.75 1.28 4.76l4.06 2.9c.94-2.85 3.56-4.91 6.66-4.91z" />
                </svg>
                <span>Ingresar con Google</span>
              </>
            )}
          </button>
        </div>

        {import.meta.env.DEV && (
          <div className="mt-8 pt-6 border-t border-[#2D3748] text-center space-y-1">
            <p className="text-xs text-[#94A3B8]/60">
              Entrá siempre en <span className="text-fifa-gold font-medium">http://localhost:5173</span>
            </p>
            <p className="text-[11px] text-[#94A3B8]/40">
              El puerto 4000 es solo la consola técnica de Firebase (admin/dev), no es la app.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
