import { fileURLToPath } from 'url';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  writeBatch,
  getFirestore,
  connectFirestoreEmulator,
} from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
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
  const matchSnap = await getDocs(collection(db, 'matches'));
  const firestoreMatches = matchSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  if (firestoreMatches.length === 0) {
    emit('No hay partidos en Firestore. Ejecutá primero npm run seed:fixture.');
    return { updated: 0, scored: 0, log };
  }

  /* ---- helpers ---- */
  function findMatch(apiMatch, fsMatches) {
    const home = matchTeamName(apiMatch.homeTeam);
    const away = matchTeamName(apiMatch.awayTeam);
    return fsMatches.find(
      (m) => m.homeTeam === home && m.awayTeam === away
    ) || null;
  }

  let updated = 0;
  let scored = 0;

  /* ---- 1. Live & recent matches ---- */
  const liveRecent = await fetchLiveAndRecentMatches();
  if (liveRecent.length === 0) {
    emit('No se encontraron partidos en vivo o recientes desde la API.');
  }

  for (const apiMatch of liveRecent) {
    const fsMatch = findMatch(apiMatch, firestoreMatches);
    if (!fsMatch) {
      emit(`  ↦ Sin equivalencia: ${apiMatch.homeTeam} vs ${apiMatch.awayTeam} (${apiMatch.status})`);
      continue;
    }

    const isLive = apiMatch.status === 'IN_PLAY' || apiMatch.status === 'PAUSED';

    if (isLive && !fsMatch.locked) {
      await updateDoc(doc(db, 'matches', fsMatch.id), {
        locked: true,
        status: 'live',
      });
      emit(`  🔒 Bloqueado: ${fsMatch.homeTeam} vs ${fsMatch.awayTeam} → live`);
      updated++;
      continue;
    }

    if (apiMatch.status === 'FINISHED' && fsMatch.status !== 'finished') {
      const homeScore = apiMatch.homeScore;
      const awayScore = apiMatch.awayScore;

      if (homeScore == null || awayScore == null) {
        emit(`  ⚠  Sin marcador para: ${fsMatch.homeTeam} vs ${fsMatch.awayTeam}`);
        continue;
      }

      await updateDoc(doc(db, 'matches', fsMatch.id), {
        homeScore,
        awayScore,
        status: 'finished',
        locked: true,
      });
      emit(`  ✅ Resultado: ${fsMatch.homeTeam} ${homeScore} - ${awayScore} ${fsMatch.awayTeam}`);
      updated++;

      /* score predictions for this match */
      const predSnap = await getDocs(
        query(collection(db, 'predictions'), where('matchId', '==', fsMatch.id))
      );
      if (predSnap.empty) {
        emit(`     ↦ Sin predicciones que puntuar.`);
        continue;
      }

      const matchForCalc = { homeScore, awayScore };
      const batch = writeBatch(db);
      let batchCount = 0;

      predSnap.docs.forEach((pd) => {
        const data = pd.data();
        const points = calculatePoints(data, matchForCalc);
        batch.update(doc(db, 'predictions', pd.id), { points });
        batchCount++;
        scored++;
      });

      await batch.commit();
      emit(`     🎯 ${batchCount} predicciones puntuadas.`);
    }
  }

  /* ---- 2. Upcoming matches — lock those starting within 5 min ---- */
  const upcoming = await fetchUpcomingMatches();
  const now = new Date();
  const fiveMinFromNow = new Date(now.getTime() + 5 * 60 * 1000);

  for (const apiMatch of upcoming) {
    if (!apiMatch.utcDate) continue;

    const matchDate = new Date(apiMatch.utcDate);
    if (matchDate > now && matchDate <= fiveMinFromNow) {
      const fsMatch = findMatch(apiMatch, firestoreMatches);
      if (!fsMatch) continue;
      if (fsMatch.locked) continue;

      await updateDoc(doc(db, 'matches', fsMatch.id), {
        locked: true,
      });
      emit(`  🔒 Bloqueado (próximo 5 min): ${fsMatch.homeTeam} vs ${fsMatch.awayTeam}`);
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
  const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || undefined,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || undefined,
    appId: process.env.VITE_FIREBASE_APP_ID,
  };

  let app;
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  const db = getFirestore(app);

  if (process.env.FIRESTORE_EMULATOR_HOST) {
    const [host, portStr] = process.env.FIRESTORE_EMULATOR_HOST.split(':');
    connectFirestoreEmulator(db, host, Number(portStr) || 8080);
    console.log(`🔧 Usando emulador Firestore en ${process.env.FIRESTORE_EMULATOR_HOST}`);
  }
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
