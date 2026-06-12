import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { calculatePoints } from '../src/services/scoring.js';

async function main() {
  const [, , matchId, homeScoreStr, awayScoreStr] = process.argv;

  if (!matchId || homeScoreStr == null || awayScoreStr == null) {
    console.error('Usage: node scripts/scoreMatch.js <matchId> <homeScore> <awayScore>');
    process.exit(1);
  }

  const homeScore = parseInt(homeScoreStr, 10);
  const awayScore = parseInt(awayScoreStr, 10);

  if (isNaN(homeScore) || isNaN(awayScore)) {
    console.error('homeScore and awayScore must be integers');
    process.exit(1);
  }

  const serviceAccount = JSON.parse(readFileSync('serviceAccount.json', 'utf-8'));

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  const db = admin.firestore();

  /* ---- update match ---- */
  const matchRef = db.collection('matches').doc(matchId);
  const matchDoc = await matchRef.get();

  if (!matchDoc.exists) {
    console.error(`Match ${matchId} not found`);
    process.exit(1);
  }

  await matchRef.update({
    homeScore,
    awayScore,
    status: 'finished',
    locked: true,
  });
  console.log(`Match ${matchId} updated: ${homeScore} - ${awayScore} (finished, locked)`);

  /* ---- score predictions ---- */
  const predSnap = await db.collection('predictions').where('matchId', '==', matchId).get();

  if (predSnap.empty) {
    console.log('No predictions to score');
    process.exit(0);
  }

  const matchForCalc = { homeScore, awayScore };
  const batch = db.batch();
  let scored = 0;

  predSnap.docs.forEach((doc) => {
    const data = doc.data();
    const points = calculatePoints(data, matchForCalc);
    batch.update(db.collection('predictions').doc(doc.id), { points });
    scored++;
  });

  await batch.commit();
  console.log(`Scored ${scored} prediction(s) for match ${matchId}`);
  process.exit(0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
  });
}
