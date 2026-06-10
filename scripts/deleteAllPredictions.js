import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import readline from 'readline';

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

  const predSnap = await db.collection('predictions').get();
  const simPredSnap = await db.collection('sim_predictions').get();

  const predCount = predSnap.size;
  const simPredCount = simPredSnap.size;
  const total = predCount + simPredCount;

  console.log(`\nColección predictions:      ${predCount} documentos`);
  console.log(`Colección sim_predictions: ${simPredCount} documentos`);
  console.log(`Total:                     ${total} documentos\n`);

  if (total === 0) {
    console.log('No hay predicciones para eliminar.');
    return;
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise((resolve) => rl.question('¿Eliminar todas las predicciones? (yes/no): ', resolve));
  rl.close();

  if (answer.trim() !== 'yes') {
    console.log('Operación cancelada.');
    return;
  }

  let deleted = 0;

  for (const snap of [predSnap, simPredSnap]) {
    let batch = db.batch();
    let ops = 0;

    snap.docs.forEach((doc) => {
      batch.delete(doc.ref);
      ops++;
      deleted++;

      if (ops >= BATCH_LIMIT) {
        batch.commit();
        batch = db.batch();
        ops = 0;
      }
    });

    if (ops > 0) {
      await batch.commit();
    }
  }

  console.log(`\n✅ ${deleted} documentos eliminados (predictions: ${predCount}, sim_predictions: ${simPredCount}).`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
  });
}
