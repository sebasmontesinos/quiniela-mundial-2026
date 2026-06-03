import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  writeBatch,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { calculatePoints } from './scoring';
import { fetchPredictionsByMatch, batchUpdatePredictionPoints } from './predictions';

export function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (value.toDate) return value.toDate();
  return new Date(value);
}

export function isMatchLocked(match, now = new Date()) {
  if (match.locked) return true;
  const matchDate = toDate(match.matchDate);
  if (!matchDate) return false;
  return matchDate.getTime() <= now.getTime();
}

export function subscribeToMatches(onData, onError) {
  const q = query(collection(db, 'matches'), orderBy('matchNumber', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    },
    onError
  );
}

export async function fetchAllMatches() {
  const q = query(collection(db, 'matches'), orderBy('matchNumber', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Bloquea partidos cuya hora de inicio ya pasó. */
export async function syncExpiredMatchLocks(matches) {
  const now = new Date();
  const batch = writeBatch(db);
  let count = 0;

  matches.forEach((match) => {
    if (match.locked) return;
    const matchDate = toDate(match.matchDate);
    if (matchDate && matchDate.getTime() <= now.getTime()) {
      batch.update(doc(db, 'matches', match.id), { locked: true });
      count += 1;
    }
  });

  if (count > 0) {
    await batch.commit();
  }

  return count;
}

export async function saveMatchResult(matchId, homeScore, awayScore) {
  const matchRef = doc(db, 'matches', matchId);

  await updateDoc(matchRef, {
    homeScore: Number(homeScore),
    awayScore: Number(awayScore),
    status: 'finished',
    locked: true,
  });

  const predictions = await fetchPredictionsByMatch(matchId);
  const match = {
    homeScore: Number(homeScore),
    awayScore: Number(awayScore),
  };

  const updates = predictions.map((p) => ({
    id: p.id,
    points: calculatePoints(p, match),
  }));

  await batchUpdatePredictionPoints(updates);

  return updates.length;
}
