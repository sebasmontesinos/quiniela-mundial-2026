import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const serviceAccount = JSON.parse(readFileSync('serviceAccount.json', 'utf-8'));
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
async function main() {
  const ref = db.collection('matches').doc('GS_D_4');
  const doc = await ref.get();
  console.log('GS_D_4 actual:', doc.data().homeTeam, 'vs', doc.data().awayTeam);
  await ref.update({ homeTeam: 'Turquía', awayTeam: 'Paraguay' });
  console.log('✅ GS_D_4 corregido a Turquía vs Paraguay');
  process.exit(0);
}
main().catch(err => { console.error(err.message); process.exit(1); });
