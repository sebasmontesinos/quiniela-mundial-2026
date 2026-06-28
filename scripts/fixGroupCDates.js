import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

const serviceAccount = JSON.parse(readFileSync('serviceAccount.json', 'utf-8'));

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function main() {
  const c3Ref = db.collection('matches').doc('GS_C_3');
  const c3 = await c3Ref.get();
  console.log('GS_C_3 actual:', c3.data().homeTeam, 'vs', c3.data().awayTeam, '|', c3.data().matchDate);
  await c3Ref.update({ matchDate: '2026-06-20T00:30:00.000Z' });
  console.log('✅ GS_C_3 fecha actualizada a 2026-06-20T00:30:00.000Z');

  const c4Ref = db.collection('matches').doc('GS_C_4');
  const c4 = await c4Ref.get();
  console.log('GS_C_4 actual:', c4.data().homeTeam, 'vs', c4.data().awayTeam, '|', c4.data().matchDate);
  await c4Ref.update({
    homeTeam: 'Escocia',
    awayTeam: 'Marruecos',
    matchDate: '2026-06-19T22:00:00.000Z',
  });
  console.log('✅ GS_C_4 corregido a Escocia vs Marruecos | 2026-06-19T22:00:00.000Z');

  console.log('\n✅ Corrección completada.');
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
