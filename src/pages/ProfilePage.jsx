import { useEffect, useMemo, useState } from 'react';
import AppNav from '../components/AppNav';
import { useAuth } from '../contexts/AuthContext';
import { fetchAllMatches } from '../services/matches';
import { fetchUserPredictions } from '../services/predictions';
import { formatMatchDate, formatDate } from '../constants';
import { TeamFlag } from '../data/teamCrests.jsx';

function TeamLabel({ teamName }) {
  return (
    <span className="inline-flex items-center whitespace-nowrap">
      <TeamFlag teamName={teamName} size={20} />
      <span>{teamName}</span>
    </span>
  );
}

function StatCard({ label, value, accent = false }) {
  return (
    <div className="fifa-card p-4 flex flex-col items-center justify-center text-center">
      <span className={`text-3xl font-bold ${accent ? 'text-fifa-gold' : 'text-white'}`}>
        {value}
      </span>
      <span className="text-[0.7rem] uppercase text-[#94A3B8] mt-1 tracking-wider">{label}</span>
    </div>
  );
}

function PointsBadge({ points, matchFinished }) {
  if (!matchFinished) {
    return <span className="text-[#94A3B8] text-xs">⏳ pendiente</span>;
  }
  if (points === 3) return <span className="text-fifa-gold font-bold">🥇 3pts</span>;
  if (points === 1) return <span className="text-fifa-blue font-bold">🎯 1pt</span>;
  if (points === 0) return <span className="text-fifa-red font-bold">❌ 0pts</span>;
  return <span className="text-[#94A3B8]">—</span>;
}

export default function ProfilePage() {
  const { currentUser, userProfile, status } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [allMatches, userPreds] = await Promise.all([
          fetchAllMatches(),
          fetchUserPredictions(currentUser.uid),
        ]);
        if (!cancelled) {
          setMatches(allMatches);
          setPredictions(userPreds);
        }
      } catch (err) {
        console.error('Error loading profile data:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [currentUser]);

  const matchMap = useMemo(() => {
    const map = {};
    matches.forEach((m) => { map[m.id] = m; });
    return map;
  }, [matches]);

  const scoredPredictions = useMemo(() => {
    const list = [];
    for (const matchId of Object.keys(predictions)) {
      const pred = predictions[matchId];
      const match = matchMap[matchId];
      if (!match) continue;
      list.push({ ...pred, match });
    }
    return list;
  }, [predictions, matchMap]);

  const stats = useMemo(() => {
    const total = scoredPredictions.length;
    const finished = scoredPredictions.filter((p) => p.match.status === 'finished');
    const exactos = finished.filter((p) => p.points === 3).length;
    const ganadores = finished.filter((p) => p.points === 1).length;
    const puntos = finished.reduce((sum, p) => sum + (p.points || 0), 0);
    const accuracy = finished.length > 0
      ? Math.round(((exactos + ganadores) / finished.length) * 100)
      : 0;
    return { total, exactos, ganadores, puntos, accuracy, finishedCount: finished.length };
  }, [scoredPredictions]);

  const finishedPredictions = useMemo(() => {
    return scoredPredictions
      .filter((p) => p.match.status === 'finished')
      .sort((a, b) => {
        const aDate = a.match.matchDate?.toDate?.()?.getTime() ?? 0;
        const bDate = b.match.matchDate?.toDate?.()?.getTime() ?? 0;
        return bDate - aDate;
      });
  }, [scoredPredictions]);

  const upcomingPredictions = useMemo(() => {
    return scoredPredictions
      .filter((p) => p.match.status === 'upcoming' && !p.match.locked)
      .sort((a, b) => {
        const aDate = a.match.matchDate?.toDate?.()?.getTime() ?? 0;
        const bDate = b.match.matchDate?.toDate?.()?.getTime() ?? 0;
        return aDate - bDate;
      });
  }, [scoredPredictions]);

  const photoURL = currentUser?.photoURL;
  const displayName = userProfile?.name || currentUser?.displayName || 'Usuario';
  const email = currentUser?.email;
  const createdAt = userProfile?.createdAt;

  const statusStyles = {
    active: 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/40',
    pending: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    blocked: 'bg-fifa-red/20 text-fifa-red border-fifa-red/40',
  };
  const statusLabels = {
    active: 'Activo',
    pending: 'Pendiente',
    blocked: 'Suspendido',
  };

  return (
    <div className="min-h-screen bg-fifa-gradient text-[#F8FAFC]">
      <AppNav />
      <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-16">
        <header className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-8">
          {photoURL ? (
            <img
              src={photoURL}
              alt=""
              className="w-20 h-20 rounded-full object-cover border-2 border-fifa-gold/40 flex-shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-fifa-gold/20 flex items-center justify-center text-fifa-gold text-2xl font-bold border-2 border-fifa-gold/40 flex-shrink-0">
              {(displayName || '?')[0].toUpperCase()}
            </div>
          )}
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-bold text-white">{displayName}</h1>
            {email && <p className="text-[#94A3B8] text-sm mt-0.5">{email}</p>}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2">
              {createdAt && (
                <span className="text-xs text-[#94A3B8]">
                  Miembro desde {formatDate(createdAt)}
                </span>
              )}
              <span
                className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                  statusStyles[status] || 'bg-[#2D3748]/50 text-[#94A3B8]'
                }`}
              >
                {statusLabels[status] || status}
              </span>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="fifa-card p-4 animate-pulse">
                <div className="h-8 w-12 bg-[#2D3748] rounded mx-auto mb-2" />
                <div className="h-3 w-16 bg-[#2D3748] rounded mx-auto" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <StatCard label="Predicciones" value={stats.total} />
              <StatCard label="Exactos (3pts)" value={stats.exactos} accent />
              <StatCard label="Ganadores (1pt)" value={stats.ganadores} accent />
              <StatCard label="Puntos totales" value={stats.puntos} accent />
            </div>

            <div className="fifa-card p-4 mb-8 text-center">
              <span className="text-4xl font-bold text-fifa-gold">{stats.accuracy}%</span>
              <p className="text-[0.7rem] uppercase text-[#94A3B8] mt-1 tracking-wider">
                Precision ({stats.exactos + stats.ganadores} aciertos de {stats.finishedCount}{' '}
                partidos finalizados)
              </p>
            </div>

            {upcomingPredictions.length > 0 && (
              <div className="fifa-card overflow-hidden mb-8">
                <div className="px-4 py-3 border-b border-[#2D3748]">
                  <h2 className="text-sm font-bold text-fifa-gold uppercase tracking-wider">
                    Predicciones enviadas — esperando el partido
                  </h2>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    {upcomingPredictions.length} partido{upcomingPredictions.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="divide-y divide-[#2D3748]">
                  {upcomingPredictions.map((p) => (
                    <div key={p.id || p.matchId} className="px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-sm">
                        <TeamLabel teamName={p.match.homeTeam} />
                        <span className="text-[#94A3B8]">vs</span>
                        <TeamLabel teamName={p.match.awayTeam} />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#94A3B8]">
                        <span>{formatMatchDate(p.match.matchDate)}</span>
                        <span className="text-white font-semibold">
                          {p.predictedHomeScore} — {p.predictedAwayScore}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="fifa-card overflow-hidden">
              <div className="px-4 py-3 border-b border-[#2D3748]">
                <h2 className="text-sm font-bold text-fifa-gold uppercase tracking-wider">
                  Historial de predicciones
                </h2>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  {finishedPredictions.length} partido{finishedPredictions.length !== 1 ? 's' : ''}{' '}
                  finalizado{finishedPredictions.length !== 1 ? 's' : ''}
                </p>
              </div>

              {finishedPredictions.length === 0 ? (
                <div className="px-4 py-8 text-center text-[#94A3B8] text-sm">
                  Todavía no hay partidos finalizados.
                </div>
              ) : (
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-[#2D3748] bg-[#111827]">
                        <th className="px-3 py-2.5 font-semibold text-fifa-gold">Partido</th>
                        <th className="px-3 py-2.5 font-semibold text-fifa-gold">Tu predicción</th>
                        <th className="px-3 py-2.5 font-semibold text-fifa-gold">Resultado</th>
                        <th className="px-3 py-2.5 font-semibold text-fifa-gold">Pts</th>
                        <th className="px-3 py-2.5 font-semibold text-fifa-gold hidden sm:table-cell">Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {finishedPredictions.map((p) => {
                        const m = p.match;
                        return (
                          <tr key={p.id || p.matchId} className="border-b border-[#2D3748] hover:bg-white/5 transition-colors">
                            <td className="px-3 py-2.5">
                              <div className="flex flex-col gap-0.5 text-xs">
                                <span className="flex items-center gap-1.5 whitespace-nowrap">
                                  <TeamLabel teamName={m.homeTeam} />
                                </span>
                                <span className="flex items-center gap-1.5 whitespace-nowrap">
                                  <TeamLabel teamName={m.awayTeam} />
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-white font-semibold whitespace-nowrap">
                              {p.predictedHomeScore} — {p.predictedAwayScore}
                            </td>
                            <td className="px-3 py-2.5 text-white whitespace-nowrap">
                              {m.homeScore} — {m.awayScore}
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              <PointsBadge points={p.points} matchFinished />
                            </td>
                            <td className="px-3 py-2.5 text-[#94A3B8] text-xs hidden sm:table-cell whitespace-nowrap">
                              {formatMatchDate(m.matchDate)}
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
      </div>
    </div>
  );
}
