import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { STAGE_LABELS, STAGE_ORDER } from '../../data/fixture';
import {
  applySimResult,
  fetchSimMatches,
  initializeSimulation,
  isSimulationInitialized,
  resetSimulation,
  setSimulationMode,
} from '../../services/simulation';

import { formatMatchDate } from '../../constants';

export default function SimulationTab() {
  const { currentUser, isAdmin, simulationMode } = useAuth();

  const [initialized, setInitialized] = useState(null);
  const [matches, setMatches] = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const ok = await isSimulationInitialized();
      if (cancelled) return;
      setInitialized(ok);
      if (ok) {
        const list = await fetchSimMatches();
        if (!cancelled) setMatches(list);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const ok = await isSimulationInitialized();
      if (cancelled) return;
      setInitialized(ok);
      if (ok) {
        const list = await fetchSimMatches();
        if (!cancelled) setMatches(list);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const handleToggle = async () => {
    if (!isAdmin || !currentUser) return;

    if (simulationMode) {
      const confirmed = window.confirm(
        'Turning simulation mode OFF will reset the view for ALL users to real data. Continue?'
      );
      if (!confirmed) return;
    }

    try {
      setBusy(true);
      await setSimulationMode(!simulationMode, currentUser.uid);
      showMessage('success', `Simulation mode: ${!simulationMode ? 'ON' : 'OFF'}`);
    } catch (err) {
      console.error(err);
      showMessage('error', 'Could not toggle simulation mode.');
    } finally {
      setBusy(false);
    }
  };

  const reloadMatchesAndStatus = async () => {
    const ok = await isSimulationInitialized();
    setInitialized(ok);
    if (ok) {
      const list = await fetchSimMatches();
      setMatches(list);
    }
  };

  const handleInitialize = async () => {
    try {
      setBusy(true);
      const result = await initializeSimulation();
      showMessage(
        'success',
        `Simulation initialized: ${result.matches} matches, ${result.predictions} predictions copied.`
      );
      await reloadMatchesAndStatus();
    } catch (err) {
      console.error(err);
      showMessage('error', 'Could not initialize simulation.');
    } finally {
      setBusy(false);
    }
  };

  const handleApplyResult = async () => {
    if (!selectedMatchId || homeScore === '' || awayScore === '') {
      showMessage('error', 'Select a match and enter both scores.');
      return;
    }

    try {
      setBusy(true);
      const count = await applySimResult(selectedMatchId, homeScore, awayScore);
      showMessage(
        'success',
        `Result applied. Points calculated for ${count} predictions.`
      );
      await reloadMatchesAndStatus();
      setSelectedMatchId('');
      setHomeScore('');
      setAwayScore('');
    } catch (err) {
      console.error(err);
      showMessage('error', 'Could not apply result.');
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async () => {
    const confirmed = window.confirm(
      'This will reset ALL simulated match results and prediction points back to initial state. Simulation mode will be turned OFF. Continue?'
    );
    if (!confirmed) return;

    try {
      setBusy(true);
      const result = await resetSimulation();
      await setSimulationMode(false, currentUser.uid);
      showMessage(
        'success',
        `Simulation reset: ${result.matches} matches, ${result.predictions} predictions restored.`
      );
      await reloadMatchesAndStatus();
    } catch (err) {
      console.error(err);
      showMessage('error', 'Could not reset simulation.');
    } finally {
      setBusy(false);
    }
  };

  const grouped = (() => {
    const byStage = {};
    matches.forEach((m) => {
      const stage = m.stage || 'group';
      if (!byStage[stage]) byStage[stage] = [];
      byStage[stage].push(m);
    });
    return STAGE_ORDER.filter((s) => byStage[s]).map((stage) => ({
      stage,
      label: STAGE_LABELS[stage],
      matches: byStage[stage],
    }));
  })();

  const selectedMatch = matches.find((m) => m.id === selectedMatchId);

  if (initialized === null) {
    return <p className="p-8 text-center text-indigo-200">Loading simulation data...</p>;
  }

  return (
    <div className="space-y-8">
      {message.text && (
        <div
          className={`px-4 py-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-200'
              : 'bg-rose-500/20 border border-rose-500/50 text-rose-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Toggle */}
      <div className="bg-white/10 border border-white/20 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold">Simulation mode</h3>
            <p className="text-indigo-200 text-sm mt-1">
              {simulationMode
                ? 'Active — all users see simulated data'
                : 'Inactive — users see real data'}
            </p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={handleToggle}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${
              simulationMode ? 'bg-amber-500' : 'bg-slate-600'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                simulationMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Initialize */}
      {!initialized && (
        <div className="bg-white/10 border border-white/20 rounded-xl p-5 text-center">
          <p className="text-indigo-200 text-sm mb-4">
            Simulation collections are empty. Copy the current match and prediction data to get started.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={handleInitialize}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 transition-colors"
          >
            {busy ? 'Initializing...' : 'Initialize simulation'}
          </button>
        </div>
      )}

      {/* Apply results */}
      {initialized && (
        <div className="bg-white/10 border border-white/20 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Apply simulation result</h3>

          {/* Match selector */}
          <div className="mb-4">
            <label className="block text-xs text-indigo-300 uppercase tracking-wide font-medium mb-2">
              Select match
            </label>
            <select
              value={selectedMatchId}
              onChange={(e) => {
                setSelectedMatchId(e.target.value);
                setHomeScore('');
                setAwayScore('');
              }}
              className="w-full bg-slate-900/60 border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm"
            >
              <option value="" className="text-slate-400">
                — Choose a match —
              </option>
              {grouped.map(({ stage, label, matches: stageMatches }) => (
                <optgroup key={stage} label={label}>
                  {stageMatches.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.homeTeam} vs {m.awayTeam} — {formatMatchDate(m.matchDate)} [{m.status}]
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Score inputs */}
          {selectedMatch && (
            <div className="flex items-end gap-4 mb-4 flex-wrap">
              <div>
                <label className="block text-xs text-indigo-300 uppercase tracking-wide font-medium mb-2">
                  {selectedMatch.homeTeam}
                </label>
                <input
                  type="number"
                  min="0"
                  value={homeScore}
                  onChange={(e) => setHomeScore(e.target.value)}
                  className="w-20 bg-slate-900/60 border border-white/20 rounded-lg px-3 py-2.5 text-white text-center"
                />
              </div>
              <span className="text-slate-500 font-bold pb-2.5">—</span>
              <div>
                <label className="block text-xs text-indigo-300 uppercase tracking-wide font-medium mb-2">
                  {selectedMatch.awayTeam}
                </label>
                <input
                  type="number"
                  min="0"
                  value={awayScore}
                  onChange={(e) => setAwayScore(e.target.value)}
                  className="w-20 bg-slate-900/60 border border-white/20 rounded-lg px-3 py-2.5 text-white text-center"
                />
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={handleApplyResult}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 transition-colors"
              >
                {busy ? 'Applying...' : 'Apply result'}
              </button>
            </div>
          )}

          {!selectedMatch && selectedMatchId && (
            <p className="text-xs text-rose-300">Match not found in simulation data.</p>
          )}
        </div>
      )}

      {/* Reset */}
      {initialized && (
        <div className="bg-white/10 border border-rose-500/30 rounded-xl p-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-white font-semibold">Reset simulation</h3>
              <p className="text-indigo-200 text-sm mt-1">
                Clear all simulated results and turn off simulation mode
              </p>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={handleReset}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-50 transition-colors"
            >
              {busy ? 'Resetting...' : 'Reset simulation'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
