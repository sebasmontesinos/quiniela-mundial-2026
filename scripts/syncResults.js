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

  // Helper: normalize any date (string or Firestore Timestamp) to epoch ms.
  const toMs = (v) => {
    if (!v) return null;
    if (typeof v === 'string') return new Date(v).getTime();
    if (v.toDate) return v.toDate().getTime();
    if (v instanceof Date) return v.getTime();
    return null;
  };

  for (const [apiStage, ourStage] of Object.entries(KNOCKOUT_STAGE_MAP)) {
    const apiArr = apiMatches.filter(
      (m) => m.stage === apiStage && (m.homeTeam || m.awayTeam) && m.utcDate
    );

    const ourArr = fsMatches.filter((m) => m.stage === ourStage);

    for (const api of apiArr) {
      const apiMs = toMs(api.utcDate);

      // Find OUR slot whose matchDate equals the API's utcDate exactly.
      const slot = ourArr.find((s) => toMs(s.matchDate) === apiMs);
      if (!slot) {
        emit(`  ⚠  Sin slot con fecha exacta para API ${api.utcDate} (${matchTeamName(api.homeTeam)} vs ${matchTeamName(api.awayTeam)})`);
        continue;
      }

      const home = matchTeamName(api.homeTeam);
      const away = matchTeamName(api.awayTeam);
      const homeChanged = home && hasPlaceholder(slot.homeTeam) && home !== slot.homeTeam;
      const awayChanged = away && hasPlaceholder(slot.awayTeam) && away !== slot.awayTeam;
      if (!homeChanged && !awayChanged) continue;
      const update = {};
      if (homeChanged) update.homeTeam = home;
      if (awayChanged) update.awayTeam = away;
      await db.collection('matches').doc(slot.id).update(update);
      emit(`  🔓 Resuelto ${slot.id} (${ourStage}): ${home} vs ${away} @ ${api.utcDate}`);
      resolved++;
    }
  }

  // Fallback: resolve R16 slots from finished R32 matches in Firestore
  // when the API hasn't populated the R16 teams yet.
  const BRACKET_TREE = {
    R16_1: ['R32_2','R32_5'],
    R16_2: ['R32_1','R32_3'],
    R16_3: ['R32_4','R32_6'],
    R16_4: ['R32_7','R32_8'],
    R16_5: ['R32_11','R32_12'],
    R16_6: ['R32_9','R32_10'],
    R16_7: ['R32_14','R32_16'],
    R16_8: ['R32_13','R32_15'],
  };

  for (const [r16Id, [feedA, feedB]] of Object.entries(BRACKET_TREE)) {
    const r16Slot = fsMatches.find(m => m.id === r16Id);
    if (!r16Slot) continue;

    const slotA = fsMatches.find(m => m.id === feedA);
    const slotB = fsMatches.find(m => m.id === feedB);

    const winnerOf = (slot) => {
      if (!slot || slot.status !== 'finished' || !slot.winner) return null;
      if (slot.winner === 'HOME_TEAM') return slot.homeTeam;
      if (slot.winner === 'AWAY_TEAM') return slot.awayTeam;
      return null;
    };

    const winnerA = winnerOf(slotA);
    const winnerB = winnerOf(slotB);

    const homeChanged = winnerA && hasPlaceholder(r16Slot.homeTeam) && winnerA !== r16Slot.homeTeam;
    const awayChanged = winnerB && hasPlaceholder(r16Slot.awayTeam) && winnerB !== r16Slot.awayTeam;

    if (!homeChanged && !awayChanged) continue;

    const update = {};
    if (homeChanged) update.homeTeam = winnerA;
    if (awayChanged) update.awayTeam = winnerB;
    await db.collection('matches').doc(r16Id).update(update);
    emit(`  🔓 Resuelto ${r16Id} desde Firestore: ${winnerA || '?'} vs ${winnerB || '?'}`);
    resolved++;
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

    const needsResync = apiMatch.status === 'FINISHED' && fsMatch.status === 'finished'
      && fsMatch.winner === 'DRAW' && apiMatch.winner && apiMatch.winner !== 'DRAW';
    if (apiMatch.status === 'FINISHED' && (fsMatch.status !== 'finished' || needsResync)) {
      const isKnockout = fsMatch.stage && fsMatch.stage !== 'group';

      // For knockout, score by the 90-minute result (regularTime).
      // If regularTime is null but extraTime exists, derive it as fullTime - extraTime.
      // Fall back to fullTime only if we have no other option.
      let rawHome, rawAway;
      if (isKnockout && apiMatch.regularTimeHome != null && apiMatch.regularTimeAway != null) {
        rawHome = apiMatch.regularTimeHome;
        rawAway = apiMatch.regularTimeAway;
      } else if (isKnockout && apiMatch.fullTimeRaw != null && apiMatch.extraTimeHome != null && apiMatch.extraTimeAway != null) {
        rawHome = apiMatch.fullTimeRaw.home - apiMatch.extraTimeHome;
        rawAway = apiMatch.fullTimeRaw.away - apiMatch.extraTimeAway;
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
      if (!winnerForUs && apiMatch.duration === 'PENALTY_SHOOTOUT') {
        const ft = apiMatch.fullTimeRaw || {};
        if (ft.home > ft.away) winnerForUs = 'HOME_TEAM';
        else if (ft.away > ft.home) winnerForUs = 'AWAY_TEAM';
      }
      if (found.reversed && winnerForUs === 'HOME_TEAM') winnerForUs = 'AWAY_TEAM';
      else if (found.reversed && winnerForUs === 'AWAY_TEAM') winnerForUs = 'HOME_TEAM';

      // Safety: if this is a penalty shootout but we still couldn't determine
      // a winner (API reporting incomplete/tied penalty data), skip this match
      // entirely rather than marking it finished with a false result.
      if (apiMatch.duration === 'PENALTY_SHOOTOUT' && !winnerForUs) {
        emit(`  ⏳ Penales en curso, esperando resultado final: ${fsMatch.homeTeam} vs ${fsMatch.awayTeam}`);
        continue;
      }

      let penaltiesForUs = null;
      if (apiMatch.duration === 'PENALTY_SHOOTOUT' && apiMatch.fullTimeRaw) {
        const ft = apiMatch.fullTimeRaw;
        penaltiesForUs = found.reversed
          ? { home: ft.away, away: ft.home }
          : { home: ft.home, away: ft.away };
      }

      await db.collection('matches').doc(fsMatch.id).update({
        homeScore,
        awayScore,
        status: 'finished',
        locked: true,
        ...(winnerForUs ? { winner: winnerForUs } : {}),
        ...(apiMatch.duration ? { duration: apiMatch.duration } : {}),
        ...(penaltiesForUs ? { penalties: penaltiesForUs } : {}),
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
