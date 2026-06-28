import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const serviceAccount = JSON.parse(readFileSync('serviceAccount.json', 'utf-8'));
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const fixes = [
  { id: 'GS_E_4', homeTeam: 'Ecuador',       awayTeam: 'Curazao' },
  { id: 'GS_F_4', homeTeam: 'Túnez',         awayTeam: 'Japón' },
  { id: 'GS_G_4', homeTeam: 'Nueva Zelanda', awayTeam: 'Egipto' },
  { id: 'GS_I_4', homeTeam: 'Noruega',       awayTeam: 'Senegal' },
  { id: 'GS_J_4', homeTeam: 'Jordania',      awayTeam: 'Argelia' },
  { id: 'GS_L_4', homeTeam: 'Panamá',        awayTeam: 'Croacia' },
  { id: 'GS_K_4', homeTeam: 'Colombia',      awayTeam: 'RD Congo' },
];

async function main() {
  for (const fix of fixes) {
    const ref = db.collection('matches').doc(fix.id);
    const doc = await ref.get();
    const d = doc.data();
    console.log(`${fix.id} actual: ${d.homeTeam} vs ${d.awayTeam}`);
    await ref.update({ homeTeam: fix.homeTeam, awayTeam: fix.awayTeam });
    console.log(`✅ ${fix.id} → ${fix.homeTeam} vs ${fix.awayTeam}`);
  }
  console.log('\n✅ Todos los partidos corregidos.');
  process.exit(0);
}

main().catch(err => { console.error(err.message); process.exit(1); });
