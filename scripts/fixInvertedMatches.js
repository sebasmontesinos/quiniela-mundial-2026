import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const serviceAccount = JSON.parse(readFileSync('serviceAccount.json', 'utf-8'));
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const fixes = [
  { id: 'GS_H_4', homeTeam: 'Uruguay',        awayTeam: 'Cabo Verde' },
  { id: 'GS_B_5', homeTeam: 'Suiza',          awayTeam: 'Canadá' },
  { id: 'GS_C_5', homeTeam: 'Escocia',        awayTeam: 'Brasil' },
  { id: 'GS_E_5', homeTeam: 'Ecuador',        awayTeam: 'Alemania' },
  { id: 'GS_F_5', homeTeam: 'Túnez',          awayTeam: 'Países Bajos' },
  { id: 'GS_D_5', homeTeam: 'Turquía',        awayTeam: 'Estados Unidos' },
  { id: 'GS_I_5', homeTeam: 'Noruega',        awayTeam: 'Francia' },
  { id: 'GS_H_5', homeTeam: 'Uruguay',        awayTeam: 'España' },
  { id: 'GS_G_5', homeTeam: 'Nueva Zelanda',  awayTeam: 'Bélgica' },
  { id: 'GS_L_5', homeTeam: 'Panamá',         awayTeam: 'Inglaterra' },
  { id: 'GS_K_5', homeTeam: 'Colombia',       awayTeam: 'Portugal' },
  { id: 'GS_J_5', homeTeam: 'Jordania',       awayTeam: 'Argentina' },
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
