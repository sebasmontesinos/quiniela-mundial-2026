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
    pending: 'bg-amber-500/20 text-amber-200 border-amber-500/40',
    active: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40',
    blocked: 'bg-rose-500/20 text-rose-200 border-rose-500/40',
  };
  const labels = {
    pending: 'Pendiente',
    active: 'Activo',
    blocked: 'Suspendido',
  };

  return (
    <span
      className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border ${styles[status] || 'bg-slate-500/20 text-slate-200'}`}
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
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-6">
        <p>No tenés permisos para acceder al panel de administración.</p>
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
        ? 'bg-indigo-600 text-white'
        : 'text-indigo-200 hover:bg-white/10'
    }`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-slate-100">
      <AppNav />
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-white">Panel de administración</h1>
          <p className="text-indigo-200 mt-1 text-sm">Usuarios y resultados de partidos</p>
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
          <div className="bg-rose-500/20 border border-rose-500/50 text-rose-200 px-4 py-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        {tab === 'users' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-white/10 border border-white/20 rounded-xl p-5">
                <p className="text-indigo-300 text-sm uppercase tracking-wide">
                  Jugadores registrados
                </p>
                <p className="text-3xl font-bold text-white mt-1">{totalUsers}</p>
              </div>
              <div className="bg-white/10 border border-white/20 rounded-xl p-5">
                <p className="text-indigo-300 text-sm uppercase tracking-wide">Usuarios activos</p>
                <p className="text-3xl font-bold text-emerald-300 mt-1">{activeUsers}</p>
              </div>
              <div className="bg-white/10 border border-white/20 rounded-xl p-5">
                <p className="text-indigo-300 text-sm uppercase tracking-wide">Pozo total</p>
                <p className="text-3xl font-bold text-amber-300 mt-1">
                  {totalPot} <span className="text-lg font-medium">Bs.</span>
                </p>
                <p className="text-xs text-indigo-300/70 mt-1">
                  {activeUsers} × {ENTRY_FEE_BS} Bs.
                </p>
              </div>
            </div>

            <div className="bg-white/10 border border-white/20 rounded-2xl overflow-hidden">
              {loading ? (
                <p className="p-8 text-center text-indigo-200">Cargando usuarios...</p>
              ) : users.length === 0 ? (
                <p className="p-8 text-center text-indigo-200">No hay usuarios registrados.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/10 bg-slate-900/50">
                        <th className="px-4 py-3 font-semibold text-indigo-200">Nombre</th>
                        <th className="px-4 py-3 font-semibold text-indigo-200">Email</th>
                        <th className="px-4 py-3 font-semibold text-indigo-200">Estado</th>
                        <th className="px-4 py-3 font-semibold text-indigo-200">Registro</th>
                        <th className="px-4 py-3 font-semibold text-indigo-200">Acciones</th>
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
                            className="border-b border-white/5 hover:bg-white/5 transition-colors"
                          >
                            <td className="px-4 py-3 text-white">
                              {user.name || '—'}
                              {isAdminUser && (
                                <span className="ml-2 text-[10px] uppercase bg-indigo-500/30 text-indigo-200 px-1.5 py-0.5 rounded">
                                  Administrador
                                </span>
                              )}
                              {isSelf && (
                                <span className="ml-2 text-[10px] uppercase text-slate-400">
                                  (vos)
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-indigo-200">{user.email || '—'}</td>
                            <td className="px-4 py-3">
                              {isAdminUser ? (
                                <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full border bg-indigo-500/20 text-indigo-200 border-indigo-500/40">
                                  Administrador
                                </span>
                              ) : (
                                <StatusBadge status={user.status} />
                              )}
                            </td>
                            <td className="px-4 py-3 text-indigo-200">
                              {formatDate(user.createdAt)}
                            </td>
                            <td className="px-4 py-3">
                              {isAdminUser ? (
                                <span className="text-xs text-slate-500">—</span>
                              ) : (
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    disabled={
                                      isSelf || user.status === 'active' || isUpdating
                                    }
                                    onClick={() => handleStatusChange(user.uid, 'active')}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    Activar
                                  </button>
                                  <button
                                    type="button"
                                    disabled={
                                      isSelf || user.status === 'blocked' || isUpdating
                                    }
                                    onClick={() => handleStatusChange(user.uid, 'blocked')}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-40 disabled:cursor-not-allowed"
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
          <div className="bg-white/10 border border-white/20 rounded-2xl overflow-hidden">
            <AdminMatchesTab />
          </div>
        )}

        {tab === 'simulation' && (
          <div className="bg-white/10 border border-white/20 rounded-2xl overflow-hidden p-6">
            <SimulationTab />
          </div>
        )}
      </div>
    </div>
  );
}
