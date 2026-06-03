import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const linkClass = ({ isActive }) =>
  `px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
    isActive
      ? 'bg-indigo-600 text-white'
      : 'text-indigo-200 hover:bg-white/10 hover:text-white'
  }`;

export default function AppNav() {
  const { isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-slate-900/80 border-b border-white/10 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-white font-bold text-sm mr-2 hidden sm:inline">
            Mundial 2026
          </span>
          <NavLink to="/fixture" className={linkClass}>
            Fixture
          </NavLink>
          <NavLink to="/standings" className={linkClass}>
            Posiciones
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" className={linkClass}>
              Admin
            </NavLink>
          )}
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="text-xs text-slate-400 hover:text-white transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}
