import { useCallback, useEffect, useState } from 'react';
import AppNav from '../components/AppNav';
import AdminMatchesTab from '../components/admin/AdminMatchesTab';
import SimulationTab from './admin/SimulationTab';
import { useAuth } from '../contexts/AuthContext';
import {
  ENTRY_FEE_BS,
  fetchAllUsers,
  isPlayerUser,
  updateUserStatus,
} from '../services/users';
import { formatDate } from '../constants';

function StatusBadge({ status }) {
  const styles = {
    pending: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    active: 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/40',
    blocked: 'bg-fifa-red/20 text-fifa-red border-fifa-red/40',
  };
  const labels = {
    pending: 'Pendiente',
    active: 'Activo',
    blocked: 'Suspendido',
  };

  return (
    <span
      className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border ${styles[status] || 'bg-[#2D3748]/50 text-[#94A3B8]'}`}
    >
      {labels[status] || status}
    </span>
  );
}

export default function AdminPanel() {
  const { currentUser, isAdmin } = useAuth();
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingUid, setUpdatingUid] = useState(null);

  const loadUsers = useCallback(async () => {
    const list = await fetchAllUsers();
    setUsers(list);
    return list;
  }, []);

  useEffect(() => {
    if (tab !== 'users') return;

    let cancelled = false;

    (async () => {
      try {
        const list = await fetchAllUsers();
        if (!cancelled) {
          setUsers(list);
          setError('');
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) setError('No se pudo cargar la lista de usuarios.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tab]);

  const handleStatusChange = async (targetUid, newStatus) => {
    try {
      setUpdatingUid(targetUid);
      setError('');
      await updateUserStatus(targetUid, newStatus);
      await loadUsers();
    } catch (err) {
      console.error(err);
      setError('No se pudo actualizar el estado del usuario.');
    } finally {
      setUpdatingUid(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-fifa-gradient text-white p-6">
        <div className="fifa-card p-8 text-center">
          <p className="text-[#94A3B8]">No tenés permisos para acceder al panel de administración.</p>
        </div>
      </div>
    );
  }

  const players = users.filter(isPlayerUser);
  const totalUsers = players.length;
  const activeUsers = players.filter((u) => u.status === 'active').length;
  const totalPot = activeUsers * ENTRY_FEE_BS;

  const tabClass = (id) =>
    `px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
      tab === id
        ? 'bg-fifa-gold/20 text-fifa-gold border border-fifa-gold/40'
        : 'text-[#94A3B8] hover:text-white hover:bg-white/5 border border-transparent'
    }`;

  return (
    <div className="min-h-screen bg-fifa-gradient text-[#F8FAFC]">
      <AppNav />
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <span className="text-fifa-gold">⚙️</span> Panel de administración
          </h1>
          <p className="text-[#94A3B8] mt-1 text-sm">Usuarios y resultados de partidos</p>
        </div>

        <div className="flex gap-2 mb-6">
          <button type="button" className={tabClass('users')} onClick={() => setTab('users')}>
            Usuarios
          </button>
          <button type="button" className={tabClass('matches')} onClick={() => setTab('matches')}>
            Partidos
          </button>
          <button type="button" className={tabClass('simulation')} onClick={() => setTab('simulation')}>
            Simulación
          </button>
        </div>

        {error && (
          <div className="bg-fifa-red/20 border border-fifa-red/50 text-fifa-red px-4 py-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        {tab === 'users' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="fifa-card p-5">
                <p className="text-fifa-gold text-sm uppercase tracking-wide">
                  Jugadores registrados
                </p>
                <p className="text-3xl font-bold text-white mt-1">{totalUsers}</p>
              </div>
              <div className="fifa-card p-5">
                <p className="text-fifa-gold text-sm uppercase tracking-wide">Usuarios activos</p>
                <p className="text-3xl font-bold text-[#10B981] mt-1">{activeUsers}</p>
              </div>
              <div className="fifa-card p-5">
                <p className="text-fifa-gold text-sm uppercase tracking-wide">Pozo total</p>
                <p className="text-3xl font-bold text-fifa-gold mt-1">
                  {totalPot} <span className="text-lg font-medium">Bs.</span>
                </p>
                <p className="text-xs text-[#94A3B8] mt-1">
                  {activeUsers} × {ENTRY_FEE_BS} Bs.
                </p>
              </div>
            </div>

            <div className="fifa-card overflow-hidden">
              {loading ? (
                <p className="p-8 text-center text-[#94A3B8]">Cargando usuarios...</p>
              ) : users.length === 0 ? (
                <p className="p-8 text-center text-[#94A3B8]">No hay usuarios registrados.</p>
              ) : (
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-[#2D3748] bg-[#111827]">
                        <th className="px-4 py-3 font-semibold text-fifa-gold">Nombre</th>
                        <th className="px-4 py-3 font-semibold text-fifa-gold">Email</th>
                        <th className="px-4 py-3 font-semibold text-fifa-gold">Estado</th>
                        <th className="px-4 py-3 font-semibold text-fifa-gold">Registro</th>
                        <th className="px-4 py-3 font-semibold text-fifa-gold">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => {
                        const isSelf = user.uid === currentUser?.uid;
                        const isUpdating = updatingUid === user.uid;
                        const isAdminUser = Boolean(user.isAdmin);

                        return (
                          <tr
                            key={user.uid}
                            className="border-b border-[#2D3748] hover:bg-white/5 transition-colors"
                          >
                            <td className="px-4 py-3 text-white">
                              {user.name || '—'}
                              {isAdminUser && (
                                <span className="ml-2 text-[10px] uppercase bg-fifa-gold/20 text-fifa-gold px-1.5 py-0.5 rounded">
                                  Administrador
                                </span>
                              )}
                              {isSelf && (
                                <span className="ml-2 text-[10px] uppercase text-[#94A3B8]">
                                  (vos)
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-[#94A3B8]">{user.email || '—'}</td>
                            <td className="px-4 py-3">
                              {isAdminUser ? (
                                <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full border bg-fifa-gold/20 text-fifa-gold border-fifa-gold/40">
                                  Administrador
                                </span>
                              ) : (
                                <StatusBadge status={user.status} />
                              )}
                            </td>
                            <td className="px-4 py-3 text-[#94A3B8]">
                              {formatDate(user.createdAt)}
                            </td>
                            <td className="px-4 py-3">
                              {isAdminUser ? (
                                <span className="text-xs text-[#94A3B8]">—</span>
                              ) : (
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    disabled={
                                      isSelf || user.status === 'active' || isUpdating
                                    }
                                    onClick={() => handleStatusChange(user.uid, 'active')}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#10B981] hover:bg-emerald-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                  >
                                    Activar
                                  </button>
                                  <button
                                    type="button"
                                    disabled={
                                      isSelf || user.status === 'blocked' || isUpdating
                                    }
                                    onClick={() => handleStatusChange(user.uid, 'blocked')}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-fifa-red hover:bg-red-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                  >
                                    Suspender
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {tab === 'matches' && (
          <div className="fifa-card overflow-hidden">
            <div className="px-4 py-3 border-b border-[#2D3748] bg-[#111827]/50">
              <p className="text-xs text-[#94A3B8]">
                Results are updated automatically via API every 5 minutes.
                Use this only as a manual override if needed.
              </p>
            </div>
            <AdminMatchesTab />
          </div>
        )}

        {tab === 'simulation' && (
          <div className="fifa-card overflow-hidden p-6">
            <SimulationTab />
          </div>
        )}
      </div>
    </div>
  );
}
