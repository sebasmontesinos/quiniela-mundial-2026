import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import {
  initializeApp,
  getApps,
  deleteApp,
} from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  connectFirestoreEmulator,
} from 'firebase/firestore';
import {
  getAuth,
  connectAuthEmulator,
  signInAnonymously,
} from 'firebase/auth';

/* ---- mock football API module ---- */
vi.mock('../src/services/footballApi.js', async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    fetchLiveAndRecentMatches: vi.fn(),
    fetchUpcomingMatches: vi.fn(),
  };
});

/* ---- imports that depend on the mock above ---- */
import { syncResults } from './syncResults.js';
import {
  fetchLiveAndRecentMatches,
  fetchUpcomingMatches,
} from '../src/services/footballApi.js';

/* ---- Firestore setup ---- */
const firebaseConfig = {
  apiKey: 'test-key',
  authDomain: 'test-project.firebaseapp.com',
  projectId: 'test-project',
  appId: 'test-app',
};

const TEST_MATCH_IDS = ['TEST_MATCH_1', 'TEST_MATCH_2', 'TEST_MATCH_3'];

let app;
let db;

async function initFirebase() {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    connectFirestoreEmulator(db, 'localhost', 8080);

    const auth = getAuth(app);
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    await signInAnonymously(auth);
  } else {
    app = getApps()[0];
    db = getFirestore(app);
  }
}

async function seedMatch(id, overrides = {}) {
  const base = {
    id,
    stage: 'group',
    group: 'A',
    matchNumber: 1,
    homeTeam: 'México',
    awayTeam: 'Sudáfrica',
    status: 'upcoming',
    homeScore: null,
    awayScore: null,
    locked: false,
    matchDate: new Date('2026-06-11T18:00:00Z'),
  };
  await setDoc(doc(db, 'matches', id), { ...base, ...overrides });
}

async function seedPrediction(userId, matchId, scores) {
  await setDoc(doc(db, 'predictions', `${userId}_${matchId}`), {
    userId,
    matchId,
    predictedHomeScore: scores.home,
    predictedAwayScore: scores.away,
    points: null,
    createdAt: new Date(),
  });
}

async function cleanup() {
  for (const mid of TEST_MATCH_IDS) {
    try {
      await deleteDoc(doc(db, 'matches', mid));
    } catch {
      /* ignore */
    }
    try {
      await deleteDoc(doc(db, 'predictions', `user1_${mid}`));
    } catch {
      /* ignore */
    }
    try {
      await deleteDoc(doc(db, 'predictions', `user2_${mid}`));
    } catch {
      /* ignore */
    }
  }
}

/* ---- tests ---- */
describe('syncResults', () => {
  beforeAll(async () => {
    await initFirebase();
  });

  afterAll(() => {
    if (app) deleteApp(app);
  });

  beforeEach(async () => {
    await cleanup();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await cleanup();
  });

  /* ---------------------------------------------------------------- */
  it('bloquea un partido cuando la API lo marca como IN_PLAY', async () => {
    await seedMatch('TEST_MATCH_1');

    fetchLiveAndRecentMatches.mockResolvedValue([
      {
        id: 99901,
        homeTeam: 'Mexico',
        awayTeam: 'South Africa',
        status: 'IN_PLAY',
        homeScore: null,
        awayScore: null,
        utcDate: '2026-06-11T18:00:00Z',
      },
    ]);
    fetchUpcomingMatches.mockResolvedValue([]);

    const result = await syncResults(db);

    expect(result.updated).toBe(1);

    const snap = await getDoc(doc(db, 'matches', 'TEST_MATCH_1'));
    expect(snap.exists()).toBe(true);
    expect(snap.data().locked).toBe(true);
    expect(snap.data().status).toBe('live');
  });

  /* ---------------------------------------------------------------- */
  it('guarda resultado y puntúa predicciones cuando la API retorna FINISHED', async () => {
    await seedMatch('TEST_MATCH_2');
    await seedPrediction('user1', 'TEST_MATCH_2', { home: 2, away: 1 });
    await seedPrediction('user2', 'TEST_MATCH_2', { home: 0, away: 0 });

    fetchLiveAndRecentMatches.mockResolvedValue([
      {
        id: 99902,
        homeTeam: 'Mexico',
        awayTeam: 'South Africa',
        status: 'FINISHED',
        homeScore: 2,
        awayScore: 1,
        utcDate: '2026-06-11T18:00:00Z',
      },
    ]);
    fetchUpcomingMatches.mockResolvedValue([]);

    const result = await syncResults(db);

    expect(result.updated).toBe(1);
    expect(result.scored).toBe(2);

    /* match document */
    const matchSnap = await getDoc(doc(db, 'matches', 'TEST_MATCH_2'));
    expect(matchSnap.data().homeScore).toBe(2);
    expect(matchSnap.data().awayScore).toBe(1);
    expect(matchSnap.data().status).toBe('finished');
    expect(matchSnap.data().locked).toBe(true);

    /* user1 predicted 2-1 → exact → 3 pts */
    const p1 = await getDoc(doc(db, 'predictions', 'user1_TEST_MATCH_2'));
    expect(p1.data().points).toBe(3);

    /* user2 predicted 0-0 → wrong (Mexico won) → 0 pts */
    const p2 = await getDoc(doc(db, 'predictions', 'user2_TEST_MATCH_2'));
    expect(p2.data().points).toBe(0);
  });

  /* ---------------------------------------------------------------- */
  it('no escribe en Firestore cuando la API falla', async () => {
    await seedMatch('TEST_MATCH_3');

    fetchLiveAndRecentMatches.mockResolvedValue([]);
    fetchUpcomingMatches.mockResolvedValue([]);

    const result = await syncResults(db);

    expect(result.updated).toBe(0);
    expect(result.scored).toBe(0);

    const snap = await getDoc(doc(db, 'matches', 'TEST_MATCH_3'));
    expect(snap.data().locked).toBe(false);
    expect(snap.data().status).toBe('upcoming');
  });
});
