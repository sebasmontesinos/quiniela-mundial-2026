import { useEffect, useMemo, useState } from 'react';
import AppNav from '../components/AppNav';
import { useAuth } from '../contexts/AuthContext';
import { STAGE_LABELS, STAGE_ORDER } from '../data/fixture';
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
import { formatMatchDate, dateKey } from '../constants';
import { CardSkeleton } from '../components/Skeleton';
import { getTeamFlag } from '../data/teamCrests';

function TeamLogo({ teamName }) {
  return (
    <span className="inline-block text-[28px] leading-none mr-2" role="img" aria-label={teamName}>
      {getTeamFlag(teamName)}
    </span>
  );
}

function MatchStatusBadge({ match, locked }) {
  if (match.status === 'finished') {
    return (
      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#2D3748]/60 text-[#94A3B8] border border-[#2D3748]">
        Finalizado
      </span>
    );
  }
  if (match.status === 'live') {
    return (
      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-fifa-red/20 text-fifa-red border border-fifa-red/40 animate-live-pulse">
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
    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-fifa-gold/20 text-fifa-gold border border-fifa-gold/30">
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
      className="mt-4 pt-4 border-t border-[#2D3748]"
    >
      <p className="text-xs text-fifa-gold mb-3 font-medium uppercase tracking-wide">
        Tu predicción
      </p>
      <div className="flex items-center gap-3 flex-wrap">
        <label className="flex flex-col gap-1 text-xs text-[#94A3B8]">
          Local
          <input
            type="number"
            min="0"
            name="homeScore"
            defaultValue={prediction?.predictedHomeScore?.toString() ?? '0'}
            className="w-16 bg-[#111827] border border-[#2D3748] rounded-lg px-2 py-1.5 text-white text-center focus:border-fifa-gold focus:outline-none"
          />
        </label>
        <span className="text-[#94A3B8] font-bold pt-4">—</span>
        <label className="flex flex-col gap-1 text-xs text-[#94A3B8]">
          Visitante
          <input
            type="number"
            min="0"
            name="awayScore"
            defaultValue={prediction?.predictedAwayScore?.toString() ?? '0'}
            className="w-16 bg-[#111827] border border-[#2D3748] rounded-lg px-2 py-1.5 text-white text-center focus:border-fifa-gold focus:outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="mt-4 bg-fifa-gold hover:bg-amber-400 text-[#0A0E1A] text-sm font-semibold px-5 py-2 rounded-lg disabled:opacity-50 transition-colors"
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
    <div className="fifa-card p-4 hover:border-fifa-gold/30 transition-colors">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div>
          {match.group && (
            <span className="text-[10px] uppercase text-fifa-gold font-bold tracking-wider">
              Grupo {match.group}
            </span>
          )}
          <p className="text-xl font-bold text-white mt-1 flex items-center flex-wrap">
            <span className="flex items-center whitespace-nowrap">
              <TeamLogo teamName={match.homeTeam} />
              {match.homeTeam}
            </span>
            <span className="text-[#94A3B8] font-normal text-base mx-2">vs</span>
            <span className="flex items-center whitespace-nowrap">
              <TeamLogo teamName={match.awayTeam} />
              {match.awayTeam}
            </span>
          </p>
        </div>
        <MatchStatusBadge match={match} locked={locked} />
      </div>

      <div className="text-xs text-[#94A3B8] space-y-1">
        <p>{formatMatchDate(match.matchDate)}</p>
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
        <div className="mt-4 pt-4 border-t border-[#2D3748]">
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
        <p className="mt-3 text-xs text-[#94A3B8]">Predicciones cerradas.</p>
      )}
    </div>
  );
}

export default function FixturePage() {
  const { currentUser, simulationMode } = useAuth();
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reloadPredictions = async () => {
    if (!currentUser) return;
    const fn = simulationMode ? fetchUserSimPredictions : fetchUserPredictions;
    const map = await fn(currentUser.uid);
    setPredictions(map);
  };

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

  const grouped = useMemo(() => {
    const byStage = {};

    matches.forEach((match) => {
      const stage = match.stage || 'group';
      if (!byStage[stage]) byStage[stage] = {};
      const dk = dateKey(match.matchDate);
      if (!byStage[stage][dk]) byStage[stage][dk] = [];
      byStage[stage][dk].push(match);
    });

    return STAGE_ORDER.filter((s) => byStage[s]).map((stage) => ({
      stage,
      label: STAGE_LABELS[stage],
      dates: Object.keys(byStage[stage]).map((dk) => ({
        dateLabel: dk,
        matches: byStage[stage][dk],
      })),
    }));
  }, [matches]);

  return (
    <div className="min-h-screen bg-fifa-gradient text-[#F8FAFC]">
      <AppNav />
      <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-16">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <span className="text-fifa-gold">📅</span> Fixture Mundial 2026
          </h1>
          <p className="text-[#94A3B8] mt-1 text-sm">
            Cargá tus resultados antes de que arranque cada partido. 3 pts plenos, 1 pt por
            acertar el ganador.
          </p>
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
                <div className="h-5 w-40 bg-[#2D3748] rounded animate-pulse" />
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
            <p className="text-[#94A3B8]">No hay partidos cargados.</p>
            <p className="text-sm text-[#94A3B8] mt-2">
              Ejecutá <code className="text-fifa-gold">npm run seed:fixture</code> con los
              emuladores activos.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {grouped.map(({ stage, label, dates }) => (
              <section key={stage}>
                <h2 className="text-lg font-extrabold text-fifa-gold mb-4 pb-2 border-b border-[#2D3748] uppercase tracking-widest">
                  {label}
                </h2>
                <div className="space-y-6">
                  {dates.map(({ dateLabel, matches: dayMatches }) => (
                    <div key={`${stage}-${dateLabel}`}>
                      <h3 className="text-sm font-semibold text-[#94A3B8] mb-3">
                        {dateLabel}
                      </h3>
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
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
