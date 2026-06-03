/**
 * Carga los 104 partidos en el emulador de Firestore.
 * Requiere: emuladores corriendo (auth + firestore).
 *
 * Uso: npm run seed:fixture
 */
import admin from 'firebase-admin';
import { MATCHES } from '../src/data/fixture.js';

const projectId = 'fixture-mundial-2026';

process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

if (!admin.apps.length) {
  admin.initializeApp({ projectId });
}

const db = admin.firestore();

function toTimestamp(date) {
  return admin.firestore.Timestamp.fromDate(date instanceof Date ? date : new Date(date));
}

async function seed() {
  console.log(`Sembrando ${MATCHES.length} partidos en el emulador (${projectId})...`);

  const batchSize = 400;
  let written = 0;

  for (let i = 0; i < MATCHES.length; i += batchSize) {
    const batch = db.batch();
    const chunk = MATCHES.slice(i, i + batchSize);

    chunk.forEach((match) => {
      const ref = db.collection('matches').doc(match.id);
      batch.set(ref, {
        id: match.id,
        stage: match.stage,
        group: match.group,
        matchNumber: match.matchNumber,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        matchDate: toTimestamp(match.matchDate),
        stadium: match.stadium,
        city: match.city,
        status: match.status,
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        locked: match.locked,
      });
    });

    await batch.commit();
    written += chunk.length;
    console.log(`  ${written}/${MATCHES.length}`);
  }

  console.log('Listo. Verificá en http://localhost:4000 → Firestore → matches');
}

seed().catch((err) => {
  console.error('Error al sembrar fixture:', err.message);
  console.error('¿Están corriendo los emuladores? npx firebase emulators:start --only auth,firestore');
  process.exit(1);
});
