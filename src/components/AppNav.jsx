import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const linkClass = ({ isActive }) =>
  `px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
    isActive
      ? 'bg-fifa-gold/20 text-fifa-gold border border-fifa-gold/40'
      : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
  }`;

export default function AppNav() {
  const { currentUser, userProfile, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const photoURL = currentUser?.photoURL;
  const displayName = userProfile?.name || currentUser?.displayName || 'Usuario';

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
        <div className="flex items-center gap-3">
          <NavLink
            to="/profile"
            className="flex items-center gap-2 text-xs text-[#94A3B8] hover:text-fifa-gold transition-colors group"
          >
            {photoURL ? (
              <img
                src={photoURL}
                alt=""
                className="w-7 h-7 rounded-full object-cover border border-fifa-gold/30 group-hover:border-fifa-gold/60 transition-colors"
              />
            ) : (
              <span className="w-7 h-7 rounded-full bg-fifa-gold/20 flex items-center justify-center text-fifa-gold text-xs font-bold border border-fifa-gold/30 group-hover:border-fifa-gold/60">
                {(displayName || '?')[0].toUpperCase()}
              </span>
            )}
            <span className="hidden sm:inline">{displayName}</span>
          </NavLink>
          <button
            type="button"
            onClick={handleLogout}
            className="text-xs text-[#94A3B8] hover:text-[#F5A623] transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </nav>
  );
}
