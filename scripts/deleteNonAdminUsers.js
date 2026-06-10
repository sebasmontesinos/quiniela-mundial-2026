import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import readline from 'readline';

const require = createRequire(import.meta.url);

async function main() {
  const serviceAccount = require('../serviceAccount.json');

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  const db = getFirestore();

  if (process.env.FIRESTORE_EMULATOR_HOST) {
    console.log('🔧 Usando emulador Firestore');
  }

  const usersSnap = await db.collection('users').get();

  const nonAdminUsers = [];
  usersSnap.forEach((doc) => {
    const data = doc.data();
    if (!data.isAdmin) {
      nonAdminUsers.push({ id: doc.id, ...data });
    }
  });

  if (nonAdminUsers.length === 0) {
    console.log('No hay usuarios no-admin para eliminar.');
    return;
  }

  console.log('\nUsuarios que serán eliminados:');
  for (const u of nonAdminUsers) {
    const uid = u.uid || u.id || '?';
    const name = u.name || '?';
    const email = u.email || '?';
    const status = u.status || '?';
    console.log(`  • ${uid}  ${name}  ${email}  ${status}`);
  }
  console.log(`\nTotal: ${nonAdminUsers.length} usuarios`);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise((resolve) => rl.question('\nDelete these users? (yes/no): ', resolve));
  rl.close();

  if (answer.trim() !== 'yes') {
    console.log('Operación cancelada.');
    return;
  }

  const batch = db.batch();
  for (const u of nonAdminUsers) {
    batch.delete(db.collection('users').doc(u.id));
  }
  await batch.commit();

  console.log(`\n✅ ${nonAdminUsers.length} usuarios eliminados.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
  });
}
