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
import { subscribeToMatches } from '../services/matches';
import { fetchPredictionsByMatch } from '../services/predictions';
import {
  subscribeToSimMatches,
  fetchSimPredictionsByMatch,
} from '../services/simulation';
import { calculatePoints } from '../services/scoring';
import { STAGE_LABELS, STAGE_ORDER } from '../data/fixture';
import { TableSkeleton } from '../components/Skeleton';
import { useToast } from '../contexts/ToastContext';

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
    <div className="w-8 h-8 rounded-full bg-fifa-gold/20 flex items-center justify-center text-fifa-gold text-sm font-bold flex-shrink-0">
      {initial}
    </div>
  );
}

function TrophyIcon() {
  return (
    <svg className="w-5 h-5 text-fifa-gold inline" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (value.toDate) return value.toDate();
  return new Date(value);
}

function formatPredictionDate(value) {
  const d = toDate(value);
  if (!d) return '—';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
}

function getResultLabel(points, matchFinished) {
  if (!matchFinished) return { icon: '⏳', text: 'Pendiente' };
  if (points === 3) return { icon: '✅', text: 'Exacto' };
  if (points === 1) return { icon: '🎯', text: 'Ganador' };
  if (points === 0) return { icon: '❌', text: 'Mal' };
  return { icon: '⏳', text: 'Pendiente' };
}

function RankMedal({ rank }) {
  if (rank === 1) return <span className="text-lg">🏆</span>;
  if (rank === 2) return <span className="text-lg">🥈</span>;
  if (rank === 3) return <span className="text-lg">🥉</span>;
  return <span className="font-bold text-white">{rank}</span>;
}

function generateWhatsAppText(match, rows, totalPot, leader) {
  const lines = [];
  lines.push('🏆 World Cup 2026 Office Pool');
  lines.push(`Match: ${match.homeTeam} vs ${match.awayTeam}`);
  lines.push('📊 Predictions (locked before kickoff):');

  rows.forEach((r) => {
    if (r.didPredict) {
      lines.push(
        `${r.user.name}: ${r.predictionText} (${formatPredictionDate(r.predictedAt)})`
      );
    } else {
      lines.push(`${r.user.name}: Did not predict`);
    }
  });

  lines.push('');
  lines.push(
    `💰 Prize pot: ${totalPot} Bs. | Leader: ${leader.name} ${leader.totalPoints}pts`
  );

  return encodeURIComponent(lines.join('\n'));
}

export default function StandingsPage() {
  const { currentUser, simulationMode } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFullStandings, setShowFullStandings] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [matchPredictions, setMatchPredictions] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const allUsers = await fetchAllUsers();
        if (!cancelled) setUsers(allUsers);
      } catch (err) {
        console.error('Error fetching users:', err);
        toast.error('Error al cargar usuarios.');
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
        toast.error('Error al suscribirse a predicciones.');
        setLoading(false);
      }
    );

    return () => unsub();
  }, [simulationMode]);

  useEffect(() => {
    const subscribe = simulationMode ? subscribeToSimMatches : subscribeToMatches;
    let firstLoad = true;
    const unsub = subscribe(
      (list) => {
        setMatches(list);
        if (firstLoad) {
          firstLoad = false;
          setSelectedMatchId((prev) => {
            if (prev) return prev;
            const PLACEHOLDER_WORDS = ['Ganador','Perdedor','1º','2º','3º','Grupo','Winner','Runner','Best'];
            const hasRealTeams = (m) => m.homeTeam && m.awayTeam && !PLACEHOLDER_WORDS.some(p => m.homeTeam.includes(p) || m.awayTeam.includes(p));
            const locked = list.filter((m) => (m.locked || m.status === 'finished') && hasRealTeams(m));
            if (locked.length === 0) return null;
            return [...locked].sort((a, b) => {
              const aDate = toDate(a.matchDate)?.getTime() ?? 0;
              const bDate = toDate(b.matchDate)?.getTime() ?? 0;
              return bDate - aDate;
            })[0].id;
          });
        }
      },
      (err) => {
        console.error('Error subscribing to matches:', err);
        toast.error('Error al suscribirse a partidos.');
      }
    );
    return () => unsub();
  }, [simulationMode]);

  useEffect(() => {
    if (!selectedMatchId) return;
    let cancelled = false;
    const fetchFn = simulationMode ? fetchSimPredictionsByMatch : fetchPredictionsByMatch;
    fetchFn(selectedMatchId)
      .then((data) => {
        if (!cancelled) setMatchPredictions(data);
      })
      .catch((err) => {
        console.error('Error fetching match predictions:', err);
        toast.error('Error al cargar predicciones del partido.');
      });
    return () => { cancelled = true; };
  }, [selectedMatchId, simulationMode]);

  const activeUsers = useMemo(() => {
    return users.filter((u) => u.status === 'active' && !u.isAdmin);
  }, [users]);

  const standings = useMemo(() => {
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
  }, [activeUsers, predictions]);

  const participantsCount = activeUsers.length;
  const totalPot = participantsCount * ENTRY_FEE_BS;
  const leader = standings[0] || null;
  const anyFinished = standings.some((s) => s.predictionsCount > 0);

  const matchDetail = useMemo(() => {
    if (!selectedMatchId) return null;
    return matches.find((m) => m.id === selectedMatchId) || null;
  }, [matches, selectedMatchId]);

  const groupedMatches = useMemo(() => {
    const filtered = matches.filter((m) => m.locked || m.status === 'finished');
    const byStage = {};
    filtered.forEach((m) => {
      const stage = m.stage || 'group';
      if (!byStage[stage]) byStage[stage] = [];
      byStage[stage].push(m);
    });
    return STAGE_ORDER.filter((s) => byStage[s]).map((stage) => ({
      stage,
      label: STAGE_LABELS[stage],
      matches: byStage[stage],
    }));
  }, [matches]);

  const auditRows = useMemo(() => {
    if (!matchDetail) return [];

    const matchFinished =
      matchDetail.homeScore != null && matchDetail.awayScore != null;

    const rows = [];
    const predictedIds = new Set();

    for (const pred of matchPredictions) {
      const uid = pred.userId;
      const user = activeUsers.find((u) => u.uid === uid);
      if (!user) continue;

      predictedIds.add(uid);

      let points = pred.points;
      if (points == null && matchFinished) {
        points = calculatePoints(pred, matchDetail);
      }

      const result = getResultLabel(points, matchFinished);

      let advancesText = null;
      if (pred.predictedAdvances) {
        const advancedTeam = pred.predictedAdvances === 'home'
          ? matchDetail.homeTeam
          : matchDetail.awayTeam;
        advancesText = `Avanza: ${advancedTeam}`;
      }

      rows.push({
        user,
        prediction: pred,
        predictionText: `${matchDetail.homeTeam} ${pred.predictedHomeScore} - ${pred.predictedAwayScore} ${matchDetail.awayTeam}`,
        advancesText,
        predictedAt: pred.createdAt || pred.updatedAt,
        result,
        points: points != null ? points : '-',
        didPredict: true,
      });
    }

    for (const user of activeUsers) {
      if (!predictedIds.has(user.uid)) {
        rows.push({
          user,
          prediction: null,
          predictionText: null,
          predictedAt: null,
          result: null,
          points: '-',
          didPredict: false,
        });
      }
    }

    rows.sort((a, b) => {
      if (a.didPredict && !b.didPredict) return -1;
      if (!a.didPredict && b.didPredict) return 1;
      if (a.didPredict && b.didPredict) {
        const aTime = toDate(a.predictedAt)?.getTime() ?? 0;
        const bTime = toDate(b.predictedAt)?.getTime() ?? 0;
        return aTime - bTime;
      }
      return (a.user.name || '').localeCompare(b.user.name || '');
    });

    return rows;
  }, [matchPredictions, matchDetail, activeUsers]);

  const topStandings = standings.slice(0, 5);
  const currentUserStanding = standings.find(
    (s) => s.uid === currentUser?.uid
  );
  const isInTop5 = currentUserStanding && topStandings.some(
    (s) => s.uid === currentUser?.uid
  );

  let currentUserFallback = null;
  if (currentUser && !currentUserStanding) {
    const found = users.find((u) => u.uid === currentUser.uid);
    if (found) {
      currentUserFallback = {
        uid: found.uid,
        name: found.name || found.email || 'Unknown',
        photoURL: found.photoURL || '',
        predictionsCount: 0,
        exactScores: 0,
        totalPoints: 0,
      };
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-fifa-gradient">
        <AppNav />
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
          <div className="mb-8">
            <div className="h-8 w-48 bg-[#2D3748] rounded animate-pulse mb-2" />
            <div className="h-4 w-64 bg-[#2D3748] rounded animate-pulse" />
          </div>
          <div className="fifa-card mb-8 h-24 animate-pulse" />
          <div className="fifa-card p-6">
            <TableSkeleton rows={5} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fifa-gradient text-[#F8FAFC]">
      <AppNav />
      <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-16">
        <header className="mb-6">
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <span className="text-fifa-gold">🏆</span> Posiciones
          </h1>
          <p className="text-[#94A3B8] mt-1 text-sm">
            Tabla de posiciones del fixture de la oficina
          </p>
        </header>

        <div className="bg-gradient-to-r from-fifa-gold/20 to-amber-600/10 border border-fifa-gold/30 fifa-card p-5 mb-8">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💰</span>
              <div>
                <p className="text-xs text-fifa-gold/80 uppercase tracking-wide">
                  Pozo total
                </p>
                <p className="text-xl font-bold text-fifa-gold">
                  {totalPot} <span className="text-sm font-medium">Bs.</span>
                </p>
              </div>
            </div>
            <div className="w-px h-10 bg-fifa-gold/20 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-2xl">👥</span>
              <div>
                <p className="text-xs text-fifa-gold/80 uppercase tracking-wide">
                  Participantes
                </p>
                <p className="text-xl font-bold text-white">{participantsCount}</p>
              </div>
            </div>
            {leader && (
              <>
                <div className="w-px h-10 bg-fifa-gold/20 hidden sm:block" />
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <p className="text-xs text-fifa-gold/80 uppercase tracking-wide">
                      Líder
                    </p>
                    <p className="text-base font-bold text-white">
                      {leader.name}{' '}
                      <span className="text-fifa-gold">{leader.totalPoints}pts</span>
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {!anyFinished && (
          <div className="bg-fifa-gold/10 border border-fifa-gold/30 text-fifa-gold px-4 py-3 rounded-lg text-sm mb-6">
            El torneo aún no comenzó. Las posiciones se actualizarán cuando
            terminen los partidos.
          </div>
        )}

        {standings.length === 0 && !currentUserFallback ? (
          <div className="fifa-card text-center py-12 mb-8">
            <p className="text-[#94A3B8]">No hay participantes activos.</p>
          </div>
        ) : (
          <div className="fifa-card overflow-hidden mb-8">
            {topStandings.map((entry, index) => {
              const isCurrentUser = entry.uid === currentUser?.uid;
              const rank = index + 1;
              const isFirst = rank === 1;
              return (
                <div
                  key={entry.uid}
                  className={`flex items-center gap-3 px-4 py-3 border-b border-[#2D3748] transition-colors ${
                    isFirst ? 'bg-fifa-gold/5 border-l-2 border-l-fifa-gold' : ''
                  } ${
                    isCurrentUser && !isFirst
                      ? 'bg-fifa-gold/5'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <div className="w-8 text-center">
                    <RankMedal rank={rank} />
                  </div>
                  <Avatar user={entry} />
                  <span
                    className={`flex-1 text-sm font-medium ${
                      isCurrentUser ? 'text-fifa-gold' : 'text-white'
                    }`}
                  >
                    {entry.name}
                    {isCurrentUser && (
                      <span className="ml-2 text-[10px] text-[#94A3B8]">(vos)</span>
                    )}
                  </span>
                  <span className={`text-lg font-bold ${isFirst ? 'text-fifa-gold' : 'text-white'}`}>
                    {entry.totalPoints}
                    {isFirst && <span className="ml-1 text-fifa-gold">👑</span>}
                  </span>
                </div>
              );
            })}

            {!isInTop5 && (currentUserStanding || currentUserFallback) && (
              <>
                <div className="flex items-center gap-2 px-4 py-2">
                  <div className="flex-1 h-px bg-[#2D3748]" />
                  <span className="text-[#94A3B8] text-xs font-medium">...</span>
                  <div className="flex-1 h-px bg-[#2D3748]" />
                </div>
                <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2D3748] bg-fifa-gold/5">
                  <div className="w-8 text-center">
                    {currentUserStanding ? (
                      <RankMedal rank={standings.indexOf(currentUserStanding) + 1} />
                    ) : (
                      <span className="text-[#94A3B8] font-bold">—</span>
                    )}
                  </div>
                  <Avatar user={currentUserStanding || currentUserFallback} />
                  <span className="flex-1 text-sm font-medium text-fifa-gold">
                    {(currentUserStanding || currentUserFallback).name}
                    <span className="ml-2 text-[10px] text-[#94A3B8]">(vos)</span>
                  </span>
                  <span className="text-lg font-bold text-white">
                    {(currentUserStanding || currentUserFallback).totalPoints}
                  </span>
                </div>
              </>
            )}

            <button
              type="button"
              onClick={() => setShowFullStandings((v) => !v)}
              className="w-full px-4 py-3 text-sm font-semibold text-fifa-gold hover:text-white hover:bg-white/5 transition-colors border-b border-[#2D3748]"
            >
              {showFullStandings
                ? '▲ Mostrar menos'
                : '▼ Ver clasificación completa'}
            </button>

            {showFullStandings && (
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#2D3748] bg-[#111827]">
                      <th className="px-4 py-3 font-semibold text-fifa-gold w-12">#</th>
                      <th className="px-4 py-3 font-semibold text-fifa-gold">Participante</th>
                      <th className="px-4 py-3 font-semibold text-fifa-gold text-center">
                        Predicciones
                      </th>
                      <th className="px-4 py-3 font-semibold text-fifa-gold text-center">
                        Exactos
                      </th>
                      <th className="px-4 py-3 font-semibold text-fifa-gold text-right">
                        Puntos
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((entry, index) => {
                      const isCurrentUser = entry.uid === currentUser?.uid;
                      const rank = index + 1;
                      return (
                        <tr
                          key={entry.uid}
                          className={`border-b border-[#2D3748] transition-colors ${
                            isCurrentUser
                              ? 'bg-fifa-gold/5'
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
                                <span
                                  className={`text-white font-medium ${
                                    isCurrentUser ? 'text-fifa-gold' : ''
                                  }`}
                                >
                                  {entry.name}
                                </span>
                                {isCurrentUser && (
                                  <span className="ml-2 text-[10px] text-[#94A3B8]">
                                    (vos)
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-[#94A3B8]">
                            {entry.predictionsCount}
                          </td>
                          <td className="px-4 py-3 text-center text-[#94A3B8]">
                            {entry.exactScores}
                          </td>
                          <td className="px-4 py-3 text-right text-white font-bold text-lg">
                            {entry.totalPoints}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div className="fifa-card overflow-hidden">
          <div className="px-4 py-4 border-b border-[#2D3748]">
            <h2 className="text-lg font-bold text-white">
              Predicciones por partido
            </h2>
            <p className="text-xs text-[#94A3B8] mt-1">
              Revisá las predicciones de todos los participantes para partidos
              cerrados.
            </p>
          </div>

          <div className="px-4 py-4 border-b border-[#2D3748]">
            {groupedMatches.length === 0 ? (
              <p className="text-sm text-[#94A3B8]">
                No hay partidos cerrados aún.
              </p>
            ) : (
              <select
                value={selectedMatchId || ''}
                onChange={(e) => setSelectedMatchId(e.target.value)}
                className="w-full bg-[#111827] border border-[#2D3748] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-fifa-gold"
              >
                {groupedMatches.map(({ stage, label, matches: stageMatches }) => (
                  <optgroup key={stage} label={label}>
                    {stageMatches.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.homeTeam} vs {m.awayTeam}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            )}
          </div>

          {matchDetail && (
            <div className="overflow-x-auto no-scrollbar">
              {auditRows.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[#94A3B8] text-sm">
                    No hay participantes activos.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#2D3748] bg-[#111827]">
                      <th className="px-4 py-3 font-semibold text-fifa-gold">
                        Participante
                      </th>
                      <th className="px-4 py-3 font-semibold text-fifa-gold">
                        Predicción
                      </th>
                      <th className="px-4 py-3 font-semibold text-fifa-gold">
                        Pronosticado
                      </th>
                      <th className="px-4 py-3 font-semibold text-fifa-gold">
                        Resultado
                      </th>
                      <th className="px-4 py-3 font-semibold text-fifa-gold text-right">
                        Pts
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditRows.map((row) => {
                      const isCurrentUser = row.user.uid === currentUser?.uid;
                      return (
                        <tr
                          key={row.user.uid}
                          className={`border-b border-[#2D3748] transition-colors ${
                            isCurrentUser
                              ? 'bg-fifa-gold/5'
                              : 'hover:bg-white/5'
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar user={row.user} />
                              <span
                                className={`text-sm font-medium ${
                                  isCurrentUser ? 'text-fifa-gold' : 'text-white'
                                }`}
                              >
                                {row.user.name}
                                {isCurrentUser && (
                                  <span className="ml-2 text-[10px] text-[#94A3B8]">
                                    (vos)
                                  </span>
                                )}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {row.didPredict ? (
                              <div>
                                <span className="text-white font-medium text-xs block">
                                  {row.predictionText}
                                </span>
                                {row.advancesText && (
                                  <span className="text-fifa-gold text-xs block mt-0.5">
                                    {row.advancesText}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="inline-block px-2 py-1 bg-[#2D3748]/50 text-[#94A3B8] text-xs rounded-full font-medium">
                                No predijo
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-[#94A3B8]">
                            {row.didPredict
                              ? formatPredictionDate(row.predictedAt)
                              : '—'}
                          </td>
                          <td className="px-4 py-3">
                            {row.didPredict ? (
                              <span
                                className={`text-xs font-semibold ${
                                  row.result?.icon === '✅'
                                    ? 'text-[#10B981]'
                                    : row.result?.icon === '🎯'
                                    ? 'text-fifa-gold'
                                    : row.result?.icon === '❌'
                                    ? 'text-fifa-red'
                                    : 'text-[#94A3B8]'
                                }`}
                              >
                                {row.result?.icon} {row.result?.text}
                              </span>
                            ) : (
                              <span className="text-xs text-[#94A3B8]">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-bold text-white">
                            {row.points}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {matchDetail && auditRows.length > 0 && (
            <div className="px-4 py-4 border-t border-[#2D3748]">
              <a
                href={`https://wa.me/?text=${generateWhatsAppText(
                  matchDetail,
                  auditRows,
                  totalPot,
                  leader || { name: '—', totalPoints: 0 }
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-fifa-gold hover:bg-amber-400 text-[#0A0E1A] text-sm font-semibold rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Compartir en WhatsApp
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
