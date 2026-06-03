import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  onSnapshot,
  query,
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import AppNav from '../components/AppNav';
import { db } from '../firebase/config';
import { ENTRY_FEE_BS, fetchAllUsers } from '../services/users';
import { TableSkeleton } from '../components/Skeleton';

function Avatar({ user }) {
  if (user.photoURL) {
    return (
      <img
        src={user.photoURL}
        alt=""
        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
      />
    );
  }
  const initial = (user.name || user.email || '?')[0].toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
      {initial}
    </div>
  );
}

function TrophyIcon() {
  return (
    <svg className="w-5 h-5 text-amber-400 inline" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

export default function StandingsPage() {
  const { currentUser, simulationMode } = useAuth();
  const [users, setUsers] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const allUsers = await fetchAllUsers();
        if (!cancelled) setUsers(allUsers);
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const colName = simulationMode ? 'sim_predictions' : 'predictions';
    const q = query(collection(db, colName));

    const unsub = onSnapshot(
      q,
      (snap) => {
        setPredictions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error('Error subscribing to predictions:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [simulationMode]);

  const standings = useMemo(() => {
    const activeUsers = users.filter((u) => u.status === 'active');
    const scored = predictions.filter((p) => p.points != null);

    const userPoints = {};
    const userExact = {};
    const userCount = {};

    scored.forEach((p) => {
      const uid = p.userId;
      if (!userPoints[uid]) {
        userPoints[uid] = 0;
        userExact[uid] = 0;
        userCount[uid] = 0;
      }
      userPoints[uid] += p.points;
      userCount[uid] += 1;
      if (p.points === 3) userExact[uid] += 1;
    });

    const rows = activeUsers
      .filter((u) => userCount[u.uid])
      .map((u) => ({
        uid: u.uid,
        name: u.name || u.email || 'Unknown',
        photoURL: u.photoURL || '',
        predictionsCount: userCount[u.uid] || 0,
        exactScores: userExact[u.uid] || 0,
        totalPoints: userPoints[u.uid] || 0,
      }));

    rows.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.exactScores !== a.exactScores) return b.exactScores - a.exactScores;
      return a.name.localeCompare(b.name);
    });

    return rows;
  }, [users, predictions]);

  const anyFinished = standings.some((s) => s.predictionsCount > 0);

  const activeCount = standings.length;
  const totalPot = activeCount * ENTRY_FEE_BS;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
        <AppNav />
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
          <div className="mb-8">
            <div className="h-8 w-48 bg-white/10 rounded animate-pulse mb-2" />
            <div className="h-4 w-64 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="h-24 bg-white/10 rounded-xl animate-pulse" />
            <div className="h-24 bg-white/10 rounded-xl animate-pulse" />
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <TableSkeleton rows={5} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-slate-100">
      <AppNav />
      <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-16">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-white">Posiciones</h1>
          <p className="text-indigo-200 mt-1 text-sm">
            Tabla de posiciones del fixture de la oficina
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-white/10 border border-white/20 rounded-xl p-5">
            <p className="text-indigo-300 text-sm uppercase tracking-wide">Participantes activos</p>
            <p className="text-3xl font-bold text-white mt-1">{activeCount}</p>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-xl p-5">
            <p className="text-indigo-300 text-sm uppercase tracking-wide">Pozo total</p>
            <p className="text-3xl font-bold text-amber-300 mt-1">
              {totalPot} <span className="text-lg font-medium">Bs.</span>
            </p>
          </div>
        </div>

        {!anyFinished && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-200 px-4 py-3 rounded-lg text-sm mb-6">
            El torneo aún no comenzó. Las posiciones se actualizarán cuando terminen los partidos.
          </div>
        )}

        {standings.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
            <p className="text-indigo-200">No hay participantes activos.</p>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-slate-900/50">
                    <th className="px-4 py-3 font-semibold text-indigo-200 w-12">#</th>
                    <th className="px-4 py-3 font-semibold text-indigo-200">Participante</th>
                    <th className="px-4 py-3 font-semibold text-indigo-200 text-center">Predicciones</th>
                    <th className="px-4 py-3 font-semibold text-indigo-200 text-center">Exactos</th>
                    <th className="px-4 py-3 font-semibold text-indigo-200 text-right">Puntos</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((entry, index) => {
                    const isCurrentUser = entry.uid === currentUser?.uid;
                    const rank = index + 1;

                    return (
                      <tr
                        key={entry.uid}
                        className={`border-b border-white/5 transition-colors ${
                          isCurrentUser
                            ? 'bg-indigo-600/10 hover:bg-indigo-600/15'
                            : 'hover:bg-white/5'
                        }`}
                      >
                        <td className="px-4 py-3 text-white font-bold">
                          {rank === 1 ? <TrophyIcon /> : rank}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar user={entry} />
                            <div>
                              <span className={`text-white font-medium ${isCurrentUser ? 'text-indigo-200' : ''}`}>
                                {entry.name}
                              </span>
                              {isCurrentUser && (
                                <span className="ml-2 text-[10px] text-slate-400">(vos)</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-indigo-200">{entry.predictionsCount}</td>
                        <td className="px-4 py-3 text-center text-indigo-200">{entry.exactScores}</td>
                        <td className="px-4 py-3 text-right text-white font-bold text-lg">
                          {entry.totalPoints}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
