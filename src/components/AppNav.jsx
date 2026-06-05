import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const linkClass = ({ isActive }) =>
  `px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
    isActive
      ? 'bg-fifa-gold/20 text-fifa-gold border border-fifa-gold/40'
      : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
  }`;

export default function AppNav() {
  const { isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-[#0A0E1A] border-b-2 border-fifa-gold/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-sm mr-3 fifa-gold-gradient text-lg hidden sm:inline tracking-wide">
            ⚽ Mundial 2026
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
          className="text-xs text-[#94A3B8] hover:text-[#F5A623] transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}
