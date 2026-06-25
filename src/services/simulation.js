import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { calculatePoints, deriveWinner } from './scoring';

const SIM_MATCHES = 'sim_matches';
const SIM_PREDICTIONS = 'sim_predictions';
const CONFIG_REF = doc(db, 'app_settings', 'config');

export function subscribeSimulationConfig(onData, onError) {
  return onSnapshot(
    CONFIG_REF,
    (snap) => {
      onData(snap.exists() ? snap.data() : null);
    },
    onError
  );
}

export async function setSimulationMode(enabled, adminUid) {
  const data = {
    simulationMode: enabled,
    updatedAt: serverTimestamp(),
    updatedBy: adminUid,
  };

  const existing = await getDoc(CONFIG_REF);
  if (existing.exists()) {
    await updateDoc(CONFIG_REF, data);
  } else {
    await setDoc(CONFIG_REF, data);
  }
}

export async function initializeSimulation() {
  const realMatches = await getDocs(
    query(collection(db, 'matches'), orderBy('matchNumber', 'asc'))
  );
  const realPredictions = await getDocs(
    query(collection(db, 'predictions'))
  );

  const batch = writeBatch(db);

  realMatches.docs.forEach((d) => {
    const data = d.data();
    const ref = doc(db, SIM_MATCHES, d.id);
    batch.set(ref, {
      ...data,
      status: 'upcoming',
      homeScore: null,
      awayScore: null,
      locked: false,
    });
  });

  realPredictions.docs.forEach((d) => {
    const data = d.data();
    const ref = doc(db, SIM_PREDICTIONS, d.id);
    batch.set(ref, {
      ...data,
      points: null,
    });
  });

  await batch.commit();

  return {
    matches: realMatches.size,
    predictions: realPredictions.size,
  };
}

export async function isSimulationInitialized() {
  const snap = await getDocs(query(collection(db, SIM_MATCHES), orderBy('matchNumber', 'asc')));
  return snap.size > 0;
}

export function subscribeToSimMatches(onData, onError) {
  const q = query(collection(db, SIM_MATCHES), orderBy('matchNumber', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    },
    onError
  );
}

export async function fetchSimMatches() {
  const q = query(collection(db, SIM_MATCHES), orderBy('matchNumber', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function fetchUserSimPredictions(userId) {
  const q = query(
    collection(db, SIM_PREDICTIONS),
    where('userId', '==', userId)
  );
  const snap = await getDocs(q);
  const map = {};
  snap.docs.forEach((d) => {
    map[d.data().matchId] = { id: d.id, ...d.data() };
  });
  return map;
}

export function simPredictionDocId(userId, matchId) {
  return `${userId}_${matchId}`;
}

export async function saveSimPrediction(userId, matchId, homeScore, awayScore) {
  if (!userId) throw new Error('saveSimPrediction called without a userId');
  if (!matchId) throw new Error('saveSimPrediction called without a matchId');

  const id = simPredictionDocId(userId, matchId);
  const ref = doc(db, SIM_PREDICTIONS, id);
  const existing = await getDoc(ref);
  const now = serverTimestamp();

  const predictedHomeScore = Number(homeScore);
  const predictedAwayScore = Number(awayScore);
  const predictedWinner = deriveWinner(predictedHomeScore, predictedAwayScore);

  if (existing.exists()) {
    await updateDoc(ref, {
      predictedHomeScore,
      predictedAwayScore,
      predictedWinner,
      updatedAt: now,
    });
  } else {
    await setDoc(ref, {
      userId,
      matchId,
      predictedHomeScore,
      predictedAwayScore,
      predictedWinner,
      updatedAt: now,
      points: null,
      createdAt: now,
    });
  }

  return id;
}

export async function fetchSimPredictionsByMatch(matchId) {
  const q = query(
    collection(db, SIM_PREDICTIONS),
    where('matchId', '==', matchId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function applySimResult(matchId, homeScore, awayScore) {
  const matchRef = doc(db, SIM_MATCHES, matchId);

  await updateDoc(matchRef, {
    homeScore: Number(homeScore),
    awayScore: Number(awayScore),
    status: 'finished',
    locked: true,
  });

  const predictions = await fetchSimPredictionsByMatch(matchId);
  const match = {
    homeScore: Number(homeScore),
    awayScore: Number(awayScore),
  };

  const batch = writeBatch(db);
  predictions.forEach((p) => {
    const points = calculatePoints(p, match);
    batch.update(doc(db, SIM_PREDICTIONS, p.id), { points });
  });
  await batch.commit();

  return predictions.length;
}

export async function resetSimulation() {
  const simMatchesSnap = await getDocs(
    query(collection(db, SIM_MATCHES))
  );
  const simPredsSnap = await getDocs(
    query(collection(db, SIM_PREDICTIONS))
  );

  const batch = writeBatch(db);

  simMatchesSnap.docs.forEach((d) => {
    batch.update(doc(db, SIM_MATCHES, d.id), {
      status: 'upcoming',
      homeScore: null,
      awayScore: null,
      locked: false,
    });
  });

  simPredsSnap.docs.forEach((d) => {
    batch.update(doc(db, SIM_PREDICTIONS, d.id), { points: null });
  });

  await batch.commit();

  return {
    matches: simMatchesSnap.size,
    predictions: simPredsSnap.size,
  };
}
