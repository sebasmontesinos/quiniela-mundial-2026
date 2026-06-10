import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

const require = createRequire(import.meta.url);

const BATCH_LIMIT = 500;

async function main() {
  const serviceAccount = require('../serviceAccount.json');

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  const db = getFirestore();

  if (process.env.FIRESTORE_EMULATOR_HOST) {
    console.log('🔧 Usando emulador Firestore');
  }

  const matchesSnap = await db.collection('matches').get();
  const total = matchesSnap.size;

  if (total === 0) {
    console.log('No hay partidos en la colección matches.');
    return;
  }

  let updated = 0;
  let batch = db.batch();
  let ops = 0;

  matchesSnap.forEach((doc) => {
    const ref = db.collection('sim_matches').doc(doc.id);
    batch.set(ref, doc.data());

    ops++;
    if (ops >= BATCH_LIMIT) {
      batch.commit();
      batch = db.batch();
      ops = 0;
    }
  });

  if (ops > 0) {
    await batch.commit();
  }

  updated = total;
  console.log(`✅ ${updated} documentos sobrescritos de matches → sim_matches.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
  });
}
