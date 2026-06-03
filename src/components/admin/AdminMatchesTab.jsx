import { useEffect, useState } from 'react';
import { fetchAllMatches, saveMatchResult } from '../../services/matches';
import { STAGE_LABELS } from '../../data/fixture';
import { useToast } from '../../contexts/ToastContext';
import { formatMatchDate } from '../../constants';

export default function AdminMatchesTab() {
  const toast = useToast();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scores, setScores] = useState({});
  const [savingId, setSavingId] = useState(null);

  const loadMatches = async () => {
    const list = await fetchAllMatches();
    setMatches(list);
    const initial = {};
    list.forEach((m) => {
      initial[m.id] = {
        home: m.homeScore?.toString() ?? '',
        away: m.awayScore?.toString() ?? '',
      };
    });
    setScores(initial);
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const list = await fetchAllMatches();
        if (!cancelled) {
          setMatches(list);
          const initial = {};
          list.forEach((m) => {
            initial[m.id] = {
              home: m.homeScore?.toString() ?? '',
              away: m.awayScore?.toString() ?? '',
            };
          });
          setScores(initial);
          setError('');
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) setError('No se pudieron cargar los partidos.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async (matchId) => {
    const home = scores[matchId]?.home;
    const away = scores[matchId]?.away;

    if (home === '' || away === '') {
      setError('Ingresá ambos resultados.');
      return;
    }

    try {
      setSavingId(matchId);
      setError('');
      const count = await saveMatchResult(matchId, home, away);
      await loadMatches();
      setError('');
      toast.success(`Resultado guardado. Se calcularon puntos para ${count} predicciones.`);
    } catch (err) {
      console.error(err);
      setError('No se pudo guardar el resultado.');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return <p className="p-8 text-center text-indigo-200">Cargando partidos...</p>;
  }

  if (matches.length === 0) {
    return (
      <div className="p-8 text-center text-indigo-200">
        <p>No hay partidos. Ejecutá npm run seed:fixture</p>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="bg-rose-500/20 border border-rose-500/50 text-rose-200 px-4 py-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-slate-900/95 z-10">
            <tr className="border-b border-white/10">
              <th className="px-3 py-2 text-indigo-200">Partido</th>
              <th className="px-3 py-2 text-indigo-200">Fecha</th>
              <th className="px-3 py-2 text-indigo-200">Estado</th>
              <th className="px-3 py-2 text-indigo-200">Resultado real</th>
              <th className="px-3 py-2 text-indigo-200">Acción</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((match) => (
              <tr key={match.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-3 py-2 text-white">
                  <span className="text-[10px] text-indigo-400 block">
                    {STAGE_LABELS[match.stage] || match.stage}
                    {match.group ? ` · Grupo ${match.group}` : ''}
                  </span>
                  {match.homeTeam} vs {match.awayTeam}
                </td>
                <td className="px-3 py-2 text-indigo-200 text-xs whitespace-nowrap">
                  {formatMatchDate(match.matchDate)}
                </td>
                <td className="px-3 py-2 text-indigo-200 capitalize">{match.status}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={scores[match.id]?.home ?? ''}
                      onChange={(e) =>
                        setScores((s) => ({
                          ...s,
                          [match.id]: { ...s[match.id], home: e.target.value },
                        }))
                      }
                      className="w-14 bg-slate-900/60 border border-white/20 rounded px-2 py-1 text-white text-center"
                      placeholder="L"
                    />
                    <span className="text-slate-500">—</span>
                    <input
                      type="number"
                      min="0"
                      value={scores[match.id]?.away ?? ''}
                      onChange={(e) =>
                        setScores((s) => ({
                          ...s,
                          [match.id]: { ...s[match.id], away: e.target.value },
                        }))
                      }
                      className="w-14 bg-slate-900/60 border border-white/20 rounded px-2 py-1 text-white text-center"
                      placeholder="V"
                    />
                  </div>
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    disabled={savingId === match.id}
                    onClick={() => handleSave(match.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
                  >
                    {savingId === match.id ? '...' : 'Guardar resultado'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
