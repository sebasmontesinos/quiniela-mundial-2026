import admin from 'firebase-admin';
import { fileURLToPath } from 'url';
import {
  fetchLiveAndRecentMatches,
  fetchUpcomingMatches,
  matchTeamName,
} from '../src/services/footballApi.js';
import { calculatePoints } from '../src/services/scoring.js';

/* ------------------------------------------------------------------ */
/*  Core sync logic — accepts a Firestore db instance                  */
/* ------------------------------------------------------------------ */
export async function syncResults(db) {
  const log = [];
  function emit(msg) {
    console.log(msg);
    log.push(msg);
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
      const homeScore = found.reversed ? apiMatch.awayScore : apiMatch.homeScore;
      const awayScore = found.reversed ? apiMatch.homeScore : apiMatch.awayScore;

      if (homeScore == null || awayScore == null) {
        emit(`  ⚠  Sin marcador para: ${fsMatch.homeTeam} vs ${fsMatch.awayTeam}`);
        continue;
      }

      await db.collection('matches').doc(fsMatch.id).update({
        homeScore,
        awayScore,
        status: 'finished',
        locked: true,
      });
      emit(`  ✅ Resultado: ${fsMatch.homeTeam} ${homeScore} - ${awayScore} ${fsMatch.awayTeam}`);
      updated++;

      /* score predictions for this match */
      const predSnap = await db.collection('predictions').where('matchId', '==', fsMatch.id).get();
      if (predSnap.empty) {
        emit(`     ↦ Sin predicciones que puntuar.`);
        continue;
      }

      const matchForCalc = { homeScore, awayScore };
      const batch = db.batch();
      let batchCount = 0;

      predSnap.docs.forEach((pd) => {
        const data = pd.data();
        const points = calculatePoints(data, matchForCalc);
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
