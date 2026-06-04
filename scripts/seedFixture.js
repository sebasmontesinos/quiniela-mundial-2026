/**
 * Carga los 104 partidos en Firestore (producción o emulador).
 *
 * Autenticación (en orden de precedencia):
 *   1. Si FIREBASE_SERVICE_ACCOUNT está definida, la usa como JSON de credenciales.
 *   2. Si GOOGLE_APPLICATION_CREDENTIALS está definida, la usa como ruta a un JSON.
 *   3. Si ningún emulador está activo, intenta con Application Default Credentials.
 *
 * Uso:
 *   node scripts/seedFixture.js
 */
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { MATCHES } from '../src/data/fixture.js';

const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'fixture-mundial-2026';

if (!admin.apps.length) {
  const firebaseConfig = { projectId };

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    firebaseConfig.credential = admin.credential.cert(serviceAccount);
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const serviceAccount = JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf-8'));
    firebaseConfig.credential = admin.credential.cert(serviceAccount);
  } else {
    console.log('⚠ No se encontró variable FIREBASE_SERVICE_ACCOUNT ni GOOGLE_APPLICATION_CREDENTIALS.');
    console.log('  Usando Application Default Credentials (gcloud / ADC).');
    firebaseConfig.credential = admin.credential.applicationDefault();
  }

  admin.initializeApp(firebaseConfig);
}

const db = admin.firestore();
const isEmulator = !!process.env.FIRESTORE_EMULATOR_HOST;

function toTimestamp(date) {
  return admin.firestore.Timestamp.fromDate(date instanceof Date ? date : new Date(date));
}

async function seed() {
  const target = isEmulator ? `emulator (${process.env.FIRESTORE_EMULATOR_HOST})` : 'production';
  console.log(`Sembrando ${MATCHES.length} partidos en ${target} (${projectId})...`);

  /* limpia partidos existentes */
  const existing = await db.collection('matches').get();
  if (!existing.empty) {
    console.log(`  Eliminando ${existing.size} partidos existentes...`);
    const delBatch = db.batch();
    existing.docs.forEach((d) => delBatch.delete(d.ref));
    await delBatch.commit();
  }

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

  const verify = await db.collection('matches').get();
  console.log(`\n✅ Listo. ${verify.size} partidos en Firestore (${target}).`);
}

seed().catch((err) => {
  console.error('Error al sembrar fixture:', err.message);
  if (!process.env.FIREBASE_SERVICE_ACCOUNT && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error('\n💡 Necesitás una cuenta de servicio. Creala en Firebase Console:');
    console.error('   Project Settings → Service accounts → Generate new private key');
    console.error('   Luego pasala como variable de entorno:');
    console.error('   export FIREBASE_SERVICE_ACCOUNT="$(cat ruta/al/json.json)"');
    console.error('   O: export GOOGLE_APPLICATION_CREDENTIALS=ruta/al/json.json');
  }
  process.exit(1);
});
