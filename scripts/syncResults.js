import admin from 'firebase-admin';
import { fileURLToPath } from 'url';
import {
  fetchLiveAndRecentMatches,
  fetchUpcomingMatches,
  fetchAllMatches,
  matchTeamName,
} from '../src/services/footballApi.js';
import { calculatePoints } from '../src/services/scoring.js';

const KNOCKOUT_STAGE_MAP = {
  LAST_32: 'r32',
  LAST_16: 'r16',
  QUARTER_FINALS: 'qf',
  SEMI_FINALS: 'sf',
  THIRD_PLACE: 'third',
  FINAL: 'final',
};

const KNOCKOUT_PLACEHOLDERS = ['Ganador', 'Perdedor', '1º', '2º', '3º', 'Grupo', 'Winner', 'Runner', 'Best'];

function hasPlaceholder(name) {
  if (!name) return true;
  return KNOCKOUT_PLACEHOLDERS.some((p) => name.includes(p));
}

export async function resolveKnockoutTeams(db, apiMatchesParam = null) {
  const log = [];
  const emit = (m) => { console.log(m); log.push(m); };

  let apiMatches = apiMatchesParam;
  if (!apiMatches) {
    try {
      apiMatches = await fetchAllMatches();
    } catch (err) {
      emit(`[resolver] Error al consultar API: ${err.message}`);
      return { resolved: 0, log };
    }
  }

  const matchSnap = await db.collection('matches').get();
  const fsMatches = matchSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  let resolved = 0;

  for (const [apiStage, ourStage] of Object.entries(KNOCKOUT_STAGE_MAP)) {
    const apiArr = apiMatches
      .filter((m) => m.stage === apiStage && m.homeTeam && m.awayTeam)
      .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));

    const ourArr = fsMatches
      .filter((m) => m.stage === ourStage)
      .sort((a, b) => (a.matchNumber || 0) - (b.matchNumber || 0));

    for (let i = 0; i < Math.min(apiArr.length, ourArr.length); i++) {
      const api = apiArr[i];
      const slot = ourArr[i];

      const stillPlaceholder = hasPlaceholder(slot.homeTeam) || hasPlaceholder(slot.awayTeam);
      if (!stillPlaceholder) continue;

      const home = matchTeamName(api.homeTeam);
      const away = matchTeamName(api.awayTeam);

      const update = { homeTeam: home, awayTeam: away };
      if (api.utcDate) update.matchDate = api.utcDate;

      await db.collection('matches').doc(slot.id).update(update);
      emit(`  🔓 Resuelto ${slot.id} (${ourStage}): ${home} vs ${away} @ ${api.utcDate}`);
      resolved++;
    }
  }

  emit(`\n📊 Resolver: ${resolved} partidos de eliminatoria resueltos.`);
  return { resolved, log };
}

/* ------------------------------------------------------------------ */
/*  Core sync logic — accepts a Firestore db instance                  */
/* ------------------------------------------------------------------ */
export async function syncResults(db) {
  const log = [];
  function emit(msg) {
    console.log(msg);
    log.push(msg);
  }

  /* ---- 0. Resolve knockout teams from API (reveals knockout matches) ---- */
  try {
    const r = await resolveKnockoutTeams(db);
    r.log.forEach((m) => log.push(m));
  } catch (err) {
    console.error(`[resolver] Error: ${err.message}`);
  }

  /* ---- fetch all Firestore matches ---- */
  const matchSnap = await db.collection('matches').get();
  const firestoreMatches = matchSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  if (firestoreMatches.length === 0) {
    emit('No hay partidos en Firestore. Ejecutá primero npm run seed:fixture.');
    return { updated: 0, scored: 0, log };
  }

  /* ---- helpers ---- */
  function findMatch(apiMatch, fsMatches) {
    const home = matchTeamName(apiMatch.homeTeam);
    const away = matchTeamName(apiMatch.awayTeam);
    const direct = fsMatches.find(
      (m) => m.homeTeam === home && m.awayTeam === away
    );
    if (direct) return { match: direct, reversed: false };
    const reversed = fsMatches.find(
      (m) => m.homeTeam === away && m.awayTeam === home
    );
    if (reversed) {
      console.log(`  ⚠  Orden invertido en API: ${apiMatch.homeTeam} vs ${apiMatch.awayTeam} → encontrado como ${reversed.homeTeam} vs ${reversed.awayTeam}`);
      return { match: reversed, reversed: true };
    }
    return null;
  }

  let updated = 0;
  let scored = 0;

  /* ---- 1. Live & recent matches ---- */
  let liveRecent;
  try {
    liveRecent = await fetchLiveAndRecentMatches();
  } catch (err) {
    console.error(`[ERROR] [${new Date().toISOString()}] Error al consultar API football-data.org (partidos en vivo/recientes): ${err.message}`);
    liveRecent = [];
  }
  if (liveRecent.length === 0) {
    console.error(`[ERROR] [${new Date().toISOString()}] La API de football-data.org devolvió 0 partidos en vivo o recientes.`);
  }

  for (const apiMatch of liveRecent) {
    const found = findMatch(apiMatch, firestoreMatches);
    if (!found) {
      emit(`  ↦ Sin equivalencia: ${apiMatch.homeTeam} vs ${apiMatch.awayTeam} (${apiMatch.status})`);
      continue;
    }

    const fsMatch = found.match;
    const isLive = apiMatch.status === 'IN_PLAY' || apiMatch.status === 'PAUSED';

    if (isLive && !fsMatch.locked) {
      await db.collection('matches').doc(fsMatch.id).update({
        locked: true,
        status: 'live',
      });
      emit(`  🔒 Bloqueado: ${fsMatch.homeTeam} vs ${fsMatch.awayTeam} → live`);
      updated++;
      continue;
    }

    if (apiMatch.status === 'FINISHED' && fsMatch.status !== 'finished') {
      const isKnockout = fsMatch.stage && fsMatch.stage !== 'group';

      // For knockout, score by the 90-minute result (regularTime). Fall back to fullTime if regularTime is missing.
      let rawHome, rawAway;
      if (isKnockout && apiMatch.regularTimeHome != null && apiMatch.regularTimeAway != null) {
        rawHome = apiMatch.regularTimeHome;
        rawAway = apiMatch.regularTimeAway;
      } else {
        rawHome = apiMatch.homeScore;
        rawAway = apiMatch.awayScore;
      }

      const homeScore = found.reversed ? rawAway : rawHome;
      const awayScore = found.reversed ? rawHome : rawAway;

      if (homeScore == null || awayScore == null) {
        emit(`  ⚠  Sin marcador para: ${fsMatch.homeTeam} vs ${fsMatch.awayTeam}`);
        continue;
      }

      // Determine winner side from our perspective (accounting for reversed order).
      // apiMatch.winner is 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' from the API's perspective.
      let winnerForUs = apiMatch.winner;
      if (found.reversed && apiMatch.winner === 'HOME_TEAM') winnerForUs = 'AWAY_TEAM';
      else if (found.reversed && apiMatch.winner === 'AWAY_TEAM') winnerForUs = 'HOME_TEAM';

      await db.collection('matches').doc(fsMatch.id).update({
        homeScore,
        awayScore,
        status: 'finished',
        locked: true,
      });
      emit(`  ✅ Resultado: ${fsMatch.homeTeam} ${homeScore} - ${awayScore} ${fsMatch.awayTeam}${isKnockout ? ' (90′)' : ''}`);
      updated++;

      /* score predictions for this match */
      const predSnap = await db.collection('predictions').where('matchId', '==', fsMatch.id).get();
      if (predSnap.empty) {
        emit(`     ↦ Sin predicciones que puntuar.`);
        continue;
      }

      const matchForCalc = { homeScore, awayScore };
      const knockoutInfo = isKnockout ? { isKnockout: true, winner: winnerForUs } : null;
      const batch = db.batch();
      let batchCount = 0;

      predSnap.docs.forEach((pd) => {
        const data = pd.data();
        const points = calculatePoints(data, matchForCalc, knockoutInfo);
        batch.update(db.collection('predictions').doc(pd.id), { points });
        batchCount++;
        scored++;
      });

      await batch.commit();
      emit(`     🎯 ${batchCount} predicciones puntuadas.`);
    }
  }

  /* ---- 2. Upcoming matches — lock those starting within 5 min ---- */
  let upcoming;
  try {
    upcoming = await fetchUpcomingMatches();
  } catch (err) {
    console.error(`[ERROR] [${new Date().toISOString()}] Error al consultar API football-data.org (partidos próximos): ${err.message}`);
    upcoming = [];
  }
  if (upcoming.length === 0) {
    console.error(`[ERROR] [${new Date().toISOString()}] La API de football-data.org devolvió 0 partidos próximos.`);
  }
  const now = new Date();
  const fiveMinFromNow = new Date(now.getTime() + 5 * 60 * 1000);

  for (const apiMatch of upcoming) {
    if (!apiMatch.utcDate) continue;

    const matchDate = new Date(apiMatch.utcDate);
    if (matchDate > now && matchDate <= fiveMinFromNow) {
      const found = findMatch(apiMatch, firestoreMatches);
      if (!found) continue;
      if (found.match.locked) continue;

      await db.collection('matches').doc(found.match.id).update({
        locked: true,
      });
      emit(`  🔒 Bloqueado (próximo 5 min): ${found.match.homeTeam} vs ${found.match.awayTeam}`);
      updated++;
    }
  }

  emit(`\n📊 Resumen: ${updated} partidos actualizados, ${scored} predicciones puntuadas.`);
  return { updated, scored, log };
}

/* ------------------------------------------------------------------ */
/*  Standalone entry point                                             */
/* ------------------------------------------------------------------ */
export async function main() {
  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}';
  const serviceAccount = JSON.parse(
    rawServiceAccount.startsWith("'")
      ? rawServiceAccount.slice(1, -1)
      : rawServiceAccount
  );

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
  const db = admin.firestore();
  return syncResults(db);
}

/* run when called directly */
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
    .then((result) => {
      console.log(`Hecho. ${result.updated} partidos, ${result.scored} predicciones.`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error en syncResults:', err.message);
      process.exit(1);
    });
}
