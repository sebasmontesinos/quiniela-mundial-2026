import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { deriveWinner } from './scoring';

export function predictionDocId(userId, matchId) {
  return `${userId}_${matchId}`;
}

export async function fetchUserPredictions(userId) {
  const q = query(collection(db, 'predictions'), where('userId', '==', userId));
  const snap = await getDocs(q);
  const map = {};
  snap.docs.forEach((d) => {
    map[d.data().matchId] = { id: d.id, ...d.data() };
  });
  return map;
}

export async function fetchPredictionsByMatch(matchId) {
  const q = query(collection(db, 'predictions'), where('matchId', '==', matchId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function savePrediction(userId, matchId, homeScore, awayScore, predictedAdvances = null) {
  if (!userId) throw new Error('savePrediction called without a userId');
  if (!matchId) throw new Error('savePrediction called without a matchId');

  const id = predictionDocId(userId, matchId);
  const ref = doc(db, 'predictions', id);
  const existing = await getDoc(ref);
  const now = serverTimestamp();

  const predictedHomeScore = Number(homeScore);
  const predictedAwayScore = Number(awayScore);
  const predictedWinner = deriveWinner(predictedHomeScore, predictedAwayScore);

  try {
    if (existing.exists()) {
      await updateDoc(ref, {
        predictedHomeScore,
        predictedAwayScore,
        predictedWinner,
        predictedAdvances: predictedAdvances ?? null,
        updatedAt: now,
      });
    } else {
      await setDoc(ref, {
        userId,
        matchId,
        predictedHomeScore,
        predictedAwayScore,
        predictedWinner,
        predictedAdvances: predictedAdvances ?? null,
        updatedAt: now,
        points: null,
        createdAt: now,
      });
    }
  } catch (err) {
    console.error(
      `[savePrediction] Firestore write failed (userId=${userId}, matchId=${matchId}):`,
      err.code,
      err.message
    );
    throw err;
  }

  return id;
}

export async function batchUpdatePredictionPoints(updates) {
  const batch = writeBatch(db);
  updates.forEach(({ id, points }) => {
    batch.update(doc(db, 'predictions', id), { points });
  });
  await batch.commit();
}
