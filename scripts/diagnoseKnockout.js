/**
 * Script DIAGNÓSTICO — SOLO LECTURA.
 *
 * NO escribe en Firestore. NO modifica nada. Solo consulta la API de
 * football-data.org y muestra por consola la estructura de los partidos,
 * con foco en las eliminatorias, para diseñar la lógica de resolución de
 * equipos (homeTeam/awayTeam) y el scoring con tiempo extra / penales.
 *
 * Uso:
 *   FOOTBALL_DATA_API_KEY="tu_key" node scripts/diagnoseKnockout.js
 *
 * (Si ya tenés un .env con la key:  node --env-file=.env scripts/diagnoseKnockout.js)
 */

const API_BASE = 'https://api.football-data.org/v4';
const COMPETITION_CODE = process.env.FOOTBALL_DATA_COMPETITION_CODE || 'WC';
const API_KEY = process.env.FOOTBALL_DATA_API_KEY || '';

if (!API_KEY) {
  console.error('❌ Falta FOOTBALL_DATA_API_KEY en el entorno.');
  process.exit(1);
}

async function apiFetch(endpoint) {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, { headers: { 'X-Auth-Token': API_KEY } });
  if (!res.ok) {
    console.error(`HTTP ${res.status} para ${url}`);
    const body = await res.text();
    console.error(body.slice(0, 500));
    process.exit(1);
  }
  return res.json();
}

function line() {
  console.log('─'.repeat(70));
}

async function main() {
  console.log(`\nConsultando TODOS los partidos de ${COMPETITION_CODE}...\n`);
  const data = await apiFetch(`/competitions/${COMPETITION_CODE}/matches`);
  const matches = data.matches || [];

  console.log(`Total de partidos devueltos por la API: ${matches.length}`);
  if (data.season?.stages) {
    console.log(`Stages declarados en season: ${JSON.stringify(data.season.stages)}`);
  }
  line();

  console.log('CONTEO POR STAGE:');
  const byStage = {};
  for (const m of matches) {
    const s = m.stage || '(sin stage)';
    byStage[s] = byStage[s] || { total: 0, status: {}, withTeams: 0, withoutTeams: 0 };
    byStage[s].total++;
    byStage[s].status[m.status] = (byStage[s].status[m.status] || 0) + 1;
    const hasTeams = !!(m.homeTeam?.name && m.awayTeam?.name);
    if (hasTeams) byStage[s].withTeams++;
    else byStage[s].withoutTeams++;
  }
  for (const [stage, info] of Object.entries(byStage)) {
    console.log(
      `  ${stage.padEnd(18)} total:${info.total}  conEquipos:${info.withTeams}  sinEquipos:${info.withoutTeams}  status:${JSON.stringify(info.status)}`
    );
  }
  line();

  console.log('MUESTRA DE 1 PARTIDO POR STAGE NO-GRUPO (estructura cruda relevante):');
  const seen = new Set();
  for (const m of matches) {
    const stage = m.stage || '(sin stage)';
    if (stage === 'GROUP_STAGE' || stage === 'GROUP' || seen.has(stage)) continue;
    seen.add(stage);
    line();
    console.log(`STAGE: ${stage}`);
    console.log(JSON.stringify({
      id: m.id,
      stage: m.stage,
      group: m.group,
      matchday: m.matchday,
      utcDate: m.utcDate,
      status: m.status,
      venue: m.venue,
      homeTeam: m.homeTeam ? { id: m.homeTeam.id, name: m.homeTeam.name } : null,
      awayTeam: m.awayTeam ? { id: m.awayTeam.id, name: m.awayTeam.name } : null,
      score: m.score,
    }, null, 2));
  }
  line();

  const finished = matches.find((m) => m.status === 'FINISHED');
  console.log('MUESTRA DE 1 PARTIDO FINISHED (estructura completa del score):');
  if (finished) {
    console.log(JSON.stringify({
      id: finished.id,
      stage: finished.stage,
      homeTeam: finished.homeTeam?.name,
      awayTeam: finished.awayTeam?.name,
      score: finished.score,
    }, null, 2));
  } else {
    console.log('  (todavía no hay partidos FINISHED)');
  }
  line();
  console.log('\n✅ Diagnóstico terminado. No se modificó ningún dato.\n');
}

main().catch((err) => {
  console.error('Error en diagnóstico:', err.message);
  process.exit(1);
});
