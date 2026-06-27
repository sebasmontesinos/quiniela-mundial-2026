import { Link } from 'react-router-dom';
import AppNav from '../components/AppNav';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { currentUser, userProfile, isAdmin } = useAuth();

  const displayName = userProfile?.name || currentUser?.displayName || 'Usuario';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-slate-100">
      <AppNav />
      <div className="max-w-xl mx-auto p-8 text-center">
        <h1 className="text-3xl font-extrabold text-white mb-2">
          ¡Hola, {displayName}!
        </h1>
        <p className="text-indigo-200 mb-8">
          Fixture de la Oficina — Mundial 2026
        </p>

        {isAdmin && (
          <p className="text-sm text-indigo-300 mb-6">
            Sos administrador. Gestioná usuarios y cargá resultados desde el panel.
          </p>
        )}

        <div className="flex flex-col gap-3">
          <Link
            to="/fixture"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Ver fixture y predicciones
          </Link>
          <Link
            to="/standings"
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-6 py-3 rounded-xl border border-white/10 transition-colors"
          >
            Posiciones
          </Link>
          <Link
            to="/bracket"
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-6 py-3 rounded-xl border border-white/10 transition-colors"
          >
            🏆 Eliminatorias
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-6 py-3 rounded-xl border border-white/10 transition-colors"
            >
              Panel de administración
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
