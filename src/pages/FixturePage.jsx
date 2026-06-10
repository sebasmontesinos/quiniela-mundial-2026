import { useEffect, useMemo, useRef, useState } from 'react';
import AppNav from '../components/AppNav';
import { useAuth } from '../contexts/AuthContext';

import {
  isMatchLocked,
  subscribeToMatches,
  syncExpiredMatchLocks,
} from '../services/matches';
import { fetchUserPredictions, savePrediction } from '../services/predictions';
import {
  subscribeToSimMatches,
  fetchUserSimPredictions,
  saveSimPrediction,
} from '../services/simulation';
import { formatMatchTime, formatDateHeader } from '../utils/dateUtils.js';
import { CardSkeleton } from '../components/Skeleton';
import Countdown from '../components/Countdown';
import { TeamFlag } from '../data/teamCrests.jsx';

function MatchStatusBadge({ match, locked }) {
  if (match.status === 'finished') {
    return (
      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#4A5568]/60 text-[#CBD5E0] border border-[#4A5568]">
        Finalizado
      </span>
    );
  }
  if (match.status === 'live') {
    return (
      <span className="text-xs font-semibold px-3 py-1 rounded-[20px] bg-[#E63946] text-white border border-[#E63946] animate-live-pulse">
        ● En vivo
      </span>
    );
  }
  if (locked) {
    return (
      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/40">
        Cerrado
      </span>
    );
  }
  return (
    <span className="text-xs font-semibold px-3 py-1 rounded-[20px] bg-[#06B894] text-white border border-[#06B894]">
      Próximo
    </span>
  );
}

function PredictionForm({ match, prediction, userId, onSaved, simulationMode }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const predictionKey = prediction
    ? `${prediction.predictedHomeScore}-${prediction.predictedAwayScore}`
    : 'new';

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const home = Number(formData.get('homeScore'));
    const away = Number(formData.get('awayScore'));

    console.log(
      `[PredictionForm] save: uid=${userId} matchId=${match.id} home=${home} away=${away} simulationMode=${simulationMode}`
    );

    try {
      setSaving(true);
      setError('');
      if (simulationMode) {
        await saveSimPrediction(userId, match.id, home, away);
      } else {
        await savePrediction(userId, match.id, home, away);
      }
      await onSaved();
    } catch (err) {
      console.error('[PredictionForm] Error saving prediction:', err.code, err.message);
      const message = err.code === 'permission-denied'
        ? 'No tenés permisos para guardar esta predicción. Tu cuenta podría estar pendiente de activación.'
        : `No se pudo guardar tu predicción. (${err.code || 'error'})`;
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      key={predictionKey}
      onSubmit={handleSubmit}
      className="mt-4 pt-4 border-t border-[#3E5FD9]"
    >
      <p className="text-xs text-fifa-gold mb-3 font-medium uppercase tracking-wide">
        Tu predicción
      </p>
      <div className="flex items-center gap-3 flex-wrap">
        <label className="flex flex-col gap-1 text-xs text-[#B8C5F0]">
          Local
          <input
            type="number"
            min="0"
            name="homeScore"
            defaultValue={prediction?.predictedHomeScore?.toString() ?? '0'}
            className="w-16 bg-white border border-[#CBD5E0] rounded-lg px-2 py-1.5 text-[#1A202C] text-center focus:border-fifa-gold focus:outline-none focus:ring-1 focus:ring-fifa-gold"
          />
        </label>
        <span className="text-[#B8C5F0] font-bold pt-4">—</span>
        <label className="flex flex-col gap-1 text-xs text-[#B8C5F0]">
          Visitante
          <input
            type="number"
            min="0"
            name="awayScore"
            defaultValue={prediction?.predictedAwayScore?.toString() ?? '0'}
            className="w-16 bg-white border border-[#CBD5E0] rounded-lg px-2 py-1.5 text-[#1A202C] text-center focus:border-fifa-gold focus:outline-none focus:ring-1 focus:ring-fifa-gold"
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="mt-4 bg-[#FFB800] hover:bg-[#FFC933] text-[#1A202C] text-sm font-bold px-5 py-2 rounded-[8px] disabled:opacity-50 transition-all shadow-lg shadow-fifa-gold/20"
        >
          {saving ? 'Guardando...' : prediction ? 'Actualizar' : 'Enviar'}
        </button>
      </div>
      {error && <p className="text-fifa-red text-xs mt-2">{error}</p>}
    </form>
  );
}

function MatchCard({ match, prediction, userId, onPredictionSaved, simulationMode }) {
  const locked = simulationMode ? match.locked : isMatchLocked(match);
  const canPredict =
    match.status === 'upcoming' && !locked && userId;
  const showResult = match.status === 'finished' && match.homeScore != null;

  return (
    <div className="fifa-card-gold-left p-4 hover:border-fifa-gold/60 transition-all">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div>
          {match.group && (
            <span className="text-[10px] uppercase text-fifa-gold font-bold tracking-wider">
              GRUPO {match.group}
            </span>
          )}
          <p className="text-xl text-white mt-1 flex items-center flex-wrap" style={{ fontSize: '1.2rem', fontWeight: 600 }}>
            <span className="flex items-center whitespace-nowrap">
              <TeamFlag teamName={match.homeTeam} size={28} />
              {match.homeTeam}
            </span>
            <span className="text-[#B8C5F0] font-normal text-base mx-2">vs</span>
            <span className="flex items-center whitespace-nowrap">
              <TeamFlag teamName={match.awayTeam} size={28} />
              {match.awayTeam}
            </span>
          </p>
        </div>
        <MatchStatusBadge match={match} locked={locked} />
      </div>

      <div className="text-xs text-[#B8C5F0] space-y-1">
        <p>{formatMatchTime(match.matchDate)}</p>
        <p>
          {match.stadium} — {match.city}
        </p>
      </div>

      {showResult && (
        <p className="mt-3 text-base font-bold text-white">
          Resultado: {match.homeScore} — {match.awayScore}
        </p>
      )}

      {canPredict && (
        <PredictionForm
          match={match}
          prediction={prediction}
          userId={userId}
          onSaved={onPredictionSaved}
          simulationMode={simulationMode}
        />
      )}

      {!canPredict && prediction && (
        <div className="mt-4 pt-4 border-t border-[#3E5FD9]">
          <p className="text-xs text-fifa-gold mb-1">Tu predicción</p>
          <p className="text-white font-semibold">
            {prediction.predictedHomeScore} — {prediction.predictedAwayScore}
          </p>
          {match.status === 'finished' && prediction.points != null && (
            <p className="text-fifa-gold text-sm mt-2 font-bold">
              +{prediction.points} pts
            </p>
          )}
        </div>
      )}

      {!canPredict && !prediction && locked && match.status !== 'finished' && (
        <p className="mt-3 text-xs text-[#B8C5F0]">Predicciones cerradas.</p>
      )}
    </div>
  );
}

function getMatchDate(match) {
  try {
    const md = match?.matchDate
    if (!md) return null
    let d
    if (md.toDate) d = md.toDate()
    else if (md.seconds) d = new Date(md.seconds * 1000)
    else d = new Date(md)
    if (isNaN(d.getTime())) return null
    return d
  } catch {
    return null
  }
}

function getLocalDateKey(match) {
  const d = getMatchDate(match)
  if (!d) return null
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(d)
  const y = parts.find(p => p.type === 'year').value
  const m = parts.find(p => p.type === 'month').value
  const day = parts.find(p => p.type === 'day').value
  return y + '-' + m + '-' + day
}

function shortDateLabel(key) {
  if (!key) return '';
  const [y, m, d] = key.split('-');
  const date = new Date(+y, +m - 1, +d);
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short', day: 'numeric', month: 'numeric'
  }).format(date);
}

function formatHeaderFromKey(key) {
  if (!key) return '';
  const [y, m, d] = key.split('-');
  const date = new Date(+y, +m - 1, +d);
  return formatDateHeader(date);
}

export default function FixturePage() {
  const { currentUser, simulationMode } = useAuth();
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const navRef = useRef(null);

  const reloadPredictions = async () => {
    if (!currentUser) return;
    const fn = simulationMode ? fetchUserSimPredictions : fetchUserPredictions;
    const map = await fn(currentUser.uid);
    setPredictions(map);
  };

  const [showAllDone, setShowAllDone] = useState(false);
  const prevPendingRef = useRef(null);

  useEffect(() => {
    if (!currentUser) return;

    const subscribe = simulationMode ? subscribeToSimMatches : subscribeToMatches;
    const fetchPredictions = simulationMode ? fetchUserSimPredictions : fetchUserPredictions;

    const unsub = subscribe(
      async (list) => {
        if (!simulationMode) {
          try {
            await syncExpiredMatchLocks(list);
          } catch (err) {
            console.warn('No se pudo sincronizar bloqueos:', err);
          }
        }
        setMatches(list);
        setLoading(false);
        try {
          const map = await fetchPredictions(currentUser.uid);
          setPredictions(map);
        } catch (predErr) {
          console.error(predErr);
        }
      },
      (err) => {
        console.error(err);
        setError('No se pudieron cargar los partidos.');
        setLoading(false);
      }
    );

    return unsub;
  }, [currentUser, simulationMode]);

  const visibleMatches = useMemo(() => {
    return matches.filter(match => {
      if (!getMatchDate(match)) return false
      if (match.stage === 'group') return true
      const isReal = (name) => {
        if (!name) return false
        const placeholders = ['Ganador', 'Perdedor', '1º', '2º',
          '3º', 'Grupo', 'Winner', 'Runner', 'Best']
        return !placeholders.some(p => name.includes(p))
      }
      return isReal(match.homeTeam) && isReal(match.awayTeam)
    })
  }, [matches])

  const pendingCount = useMemo(() => {
    if (simulationMode) return 0;
    return visibleMatches.filter(
      (m) => m.status === 'upcoming' && !isMatchLocked(m) && !predictions[m.id]
    ).length;
  }, [visibleMatches, predictions, simulationMode]);

  useEffect(() => {
    if (simulationMode) return;
    if (prevPendingRef.current != null && prevPendingRef.current > 0 && pendingCount === 0) {
      setShowAllDone(true);
      const t = setTimeout(() => setShowAllDone(false), 3000);
      return () => clearTimeout(t);
    }
    prevPendingRef.current = pendingCount;
  }, [pendingCount, simulationMode]);

  const dateKeys = useMemo(() => {
    return [...new Set(
      visibleMatches.map(getLocalDateKey).filter(Boolean)
    )].sort()
  }, [visibleMatches])

  const todayKey = useMemo(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date())
    const y = parts.find(p => p.type === 'year').value
    const m = parts.find(p => p.type === 'month').value
    const d = parts.find(p => p.type === 'day').value
    return y + '-' + m + '-' + d
  }, [])

  const initialDate = useMemo(() => {
    if (dateKeys.length === 0) return null
    if (dateKeys.includes(todayKey)) return todayKey
    return dateKeys.find(k => k >= todayKey) || dateKeys[0]
  }, [dateKeys, todayKey])

  const todayHasMatches = dateKeys.indexOf(todayKey) !== -1;

  if (selectedDate === null && initialDate !== null) {
    setSelectedDate(initialDate);
  }

  const dayMatches = useMemo(() => {
    if (!selectedDate) return [];
    return visibleMatches.filter((m) => getLocalDateKey(m) === selectedDate);
  }, [visibleMatches, selectedDate]);

  useEffect(() => {
    if (navRef.current && dateKeys.length > 0) {
      navRef.current.scrollLeft = 0;
    }
  }, [dateKeys]);

  const handleGoToday = () => {
    setSelectedDate(todayKey);
  };

  return (
    <div className="min-h-screen bg-fifa-gradient text-[#F8FAFC]">
      <AppNav />
      <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-16">
        <Countdown />

        {!simulationMode && pendingCount > 0 && (
          <div className="bg-amber-400/20 border border-amber-400/40 text-amber-300 px-4 py-3 rounded-lg text-sm mb-6 flex items-center gap-2">
            <span>⚠️</span>
            <span>
              Tenés <strong>{pendingCount}</strong> partido{pendingCount !== 1 ? 's' : ''} sin predecir. ¡El tiempo se acaba!
            </span>
          </div>
        )}

        {!simulationMode && showAllDone && (
          <div className="bg-[#10B981]/20 border border-[#10B981]/40 text-[#10B981] px-4 py-3 rounded-lg text-sm mb-6 flex items-center gap-2 animate-slide-up">
            <span>✅</span>
            <span>¡Todas tus predicciones están cargadas!</span>
          </div>
        )}

        <header className="mb-4">
          <h1 className="text-4xl font-extrabold text-white flex items-center gap-3">
            📅 Fixture Mundial 2026
          </h1>
          <span className="fifa-gold-underline mt-2" />
        </header>

        {error && (
          <div className="bg-fifa-red/20 border border-fifa-red/50 text-fifa-red px-4 py-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="h-5 w-40 bg-[#3E5FD9] rounded animate-pulse" />
                <div className="grid gap-4">
                  {Array.from({ length: 2 }).map((_, j) => (
                    <CardSkeleton key={j} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : matches.length === 0 ? (
          <div className="fifa-card text-center py-12">
            <p className="text-[#B8C5F0]">No hay partidos cargados.</p>
            <p className="text-sm text-[#B8C5F0] mt-2">
              Ejecutá <code className="text-fifa-gold">npm run seed:fixture</code> con los
              emuladores activos.
            </p>
          </div>
        ) : visibleMatches.length === 0 ? (
          <div className="fifa-card text-center py-12">
            <p className="text-[#B8C5F0]">No hay partidos disponibles.</p>
          </div>
        ) : (
          <>
            {!todayHasMatches && (
              <div className="bg-[#1A3399]/40 border border-[#3E5FD9] rounded-lg px-4 py-4 mb-4 text-center">
                <p className="text-base font-bold text-white mb-1">⚽ Hoy no hay partidos</p>
                <p className="text-sm text-[#B8C5F0]">
                  El Mundial arranca el {formatHeaderFromKey(dateKeys[0])}
                </p>
              </div>
            )}

            <div className="flex items-center gap-1 mb-4 overflow-x-auto no-scrollbar snap-x" ref={navRef}>
              {todayHasMatches && (
                <button
                  type="button"
                  onClick={handleGoToday}
                  className="flex-shrink-0 px-3 py-2 rounded-lg text-xs font-semibold bg-[#06B894] text-white hover:bg-emerald-500 transition-colors whitespace-nowrap"
                >
                  HOY
                </button>
              )}
              {dateKeys.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDate(key)}
                  className={`flex-shrink-0 snap-start px-3 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    key === selectedDate
                      ? 'bg-[#FFB800] text-[#1A202C] font-bold'
                      : 'bg-[#1A3399] border border-[#3E5FD9] text-white hover:bg-[#3E5FD9] hover:text-white'
                  }`}
                >
                  {shortDateLabel(key)}
                </button>
              ))}
            </div>

            {selectedDate && (
              <>
                <h2 className="text-lg font-extrabold text-white flex items-center gap-2 flex-wrap">
                  {formatHeaderFromKey(selectedDate)}
                  <span className="text-sm text-[#B8C5F0] font-bold">
                    ({dayMatches.length} partido{dayMatches.length !== 1 ? 's' : ''})
                  </span>
                </h2>
                <span className="fifa-gold-underline mb-4" />
                {dayMatches.length === 0 ? (
                  <div className="fifa-card text-center py-8">
                    <p className="text-[#B8C5F0]">No hay partidos este día</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {dayMatches.map((match) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        prediction={predictions[match.id]}
                        userId={currentUser?.uid}
                        onPredictionSaved={reloadPredictions}
                        simulationMode={simulationMode}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
