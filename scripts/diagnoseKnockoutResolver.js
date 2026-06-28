/**
 * DIAGNÓSTICO RESOLVER KNOCKOUT — SOLO LECTURA.
 *
 * NO escribe en Firestore. NO modifica nada. Consulta la API de
 * football-data.org y analiza si nuestro mapeo (stage + orden) para resolver
 * los equipos de eliminatoria va a funcionar correctamente.
 *
 * Responde 3 preguntas clave antes de escribir el resolver:
 *   1. ¿Qué stages de knockout existen y cuántos partidos hay en cada uno?
 *   2. ¿Los equipos ya están poblados (no null) en la API?
 *   3. ¿La estructura de `score` con regularTime/penalties aparece como esperamos?
 *   4. ¿El orden cronológico de la API coincide con nuestro orden por matchNumber?
 *
 * Uso:
 *   FOOTBALL_DATA_API_KEY="tu_key" node scripts/diagnoseKnockoutResolver.js
 *   (o con .env:  node --env-file=.env scripts/diagnoseKnockoutResolver.js)
 */

const API_BASE = 'https://api.football-data.org/v4';
const COMPETITION_CODE = process.env.FOOTBALL_DATA_COMPETITION_CODE || 'WC';
const API_KEY = process.env.FOOTBALL_DATA_API_KEY || '';

// Mapeo de nuestros stages -> stages de la API
const STAGE_MAP = {
  r32: 'LAST_32',
  r16: 'LAST_16',
  qf: 'QUARTER_FINALS',
  sf: 'SEMI_FINALS',
  third: 'THIRD_PLACE',
  final: 'FINAL',
};

if (!API_KEY) {
  console.error('❌ Falta FOOTBALL_DATA_API_KEY en el entorno.');
  process.exit(1);
}

async function apiFetch(endpoint) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'X-Auth-Token': API_KEY },
  });
  if (!res.ok) {
    console.error(`HTTP ${res.status} para ${endpoint}`);
    console.error((await res.text()).slice(0, 500));
    process.exit(1);
  }
  return res.json();
}

function line() {
  console.log('─'.repeat(72));
}

async function main() {
  console.log(`\nConsultando partidos de ${COMPETITION_CODE}...\n`);

  // 1. Traer partidos de la API
  const data = await apiFetch(`/competitions/${COMPETITION_CODE}/matches`);
  const apiMatches = data.matches || [];

  // 2. Traer nuestros slots knockout desde fixture.js
  const { MATCHES } = await import('../src/data/fixture.js');
  const ourKnockout = MATCHES.filter((m) => m.stage !== 'group');

  line();
  console.log('PASO 1 — Conteo de partidos knockout por stage (API):');
  const apiByStage = {};
  for (const m of apiMatches) {
    if (m.stage === 'GROUP_STAGE') continue;
    apiByStage[m.stage] = apiByStage[m.stage] || [];
    apiByStage[m.stage].push(m);
  }
  for (const [stage, arr] of Object.entries(apiByStage)) {
    const withTeams = arr.filter((m) => m.homeTeam?.name && m.awayTeam?.name).length;
    console.log(`  ${stage.padEnd(16)} API:${arr.length}  conEquipos:${withTeams}  sinEquipos:${arr.length - withTeams}`);
  }

  line();
  console.log('PASO 2 — Verificar que las cantidades calzan (nuestro vs API):');
  for (const [ourStage, apiStage] of Object.entries(STAGE_MAP)) {
    const ours = ourKnockout.filter((m) => m.stage === ourStage).length;
    const theirs = (apiByStage[apiStage] || []).length;
    const ok = ours === theirs ? '✅' : '❌ NO CALZA';
    console.log(`  ${ourStage} (${apiStage}): nuestro=${ours} API=${theirs} ${ok}`);
  }

  line();
  console.log('PASO 3 — Mapeo por orden cronológico (zip stage + fecha vs matchNumber):');
  console.log('  Para cada stage, ordenamos API por utcDate y nuestros slots por matchNumber.');
  console.log('  Si los equipos ya están definidos, mostramos el emparejamiento propuesto.\n');

  for (const [ourStage, apiStage] of Object.entries(STAGE_MAP)) {
    const apiArr = (apiByStage[apiStage] || [])
      .slice()
      .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));
    const ourArr = ourKnockout
      .filter((m) => m.stage === ourStage)
      .slice()
      .sort((a, b) => a.matchNumber - b.matchNumber);

    if (apiArr.length === 0) continue;

    console.log(`  ── ${ourStage.toUpperCase()} (${apiStage}) ──`);
    for (let i = 0; i < Math.max(apiArr.length, ourArr.length); i++) {
      const api = apiArr[i];
      const our = ourArr[i];
      const apiHome = api?.homeTeam?.name || 'TBD';
      const apiAway = api?.awayTeam?.name || 'TBD';
      const apiDate = api?.utcDate ? api.utcDate.slice(5, 16) : '????';
      console.log(
        `    ${our?.id?.padEnd(7) || '???'} (mn${our?.matchNumber || '?'}) ← API ${apiDate} | ${apiHome} vs ${apiAway}`
      );
    }
    console.log('');
  }

  line();
  console.log('PASO 4 — Estructura de score en partidos knockout FINISHED (si hay):');
  const finishedKo = apiMatches.find(
    (m) => m.stage !== 'GROUP_STAGE' && m.status === 'FINISHED'
  );
  if (finishedKo) {
    console.log(JSON.stringify({
      stage: finishedKo.stage,
      home: finishedKo.homeTeam?.name,
      away: finishedKo.awayTeam?.name,
      score: finishedKo.score,
    }, null, 2));
  } else {
    console.log('  (todavía no hay partidos knockout FINISHED — re-correr cuando haya)');
  }

  line();
  console.log('\n✅ Diagnóstico terminado. No se modificó ningún dato.\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error en diagnóstico:', err.message);
  process.exit(1);
});
