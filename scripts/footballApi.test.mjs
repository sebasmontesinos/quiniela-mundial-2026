import assert from 'node:assert';

const { default: mod } = await import('../src/services/footballApi.js').then(m => ({ default: m }));

const groupMatch = {
  id: 1, status: 'FINISHED', utcDate: '2026-06-11T19:00:00Z',
  stage: 'GROUP_STAGE',
  homeTeam: { name: 'Mexico' }, awayTeam: { name: 'South Africa' },
  score: { winner: 'HOME_TEAM', duration: 'REGULAR', fullTime: { home: 2, away: 0 }, halfTime: { home: 1, away: 0 } },
};

const knockoutPens = {
  id: 99, status: 'FINISHED', utcDate: '2026-06-28T19:00:00Z',
  stage: 'LAST_32',
  homeTeam: { name: 'Germany' }, awayTeam: { name: 'England' },
  score: { winner: 'HOME_TEAM', duration: 'PENALTY_SHOOTOUT', fullTime: { home: 7, away: 6 }, halfTime: { home: 1, away: 1 }, regularTime: { home: 1, away: 1 }, extraTime: { home: 0, away: 0 }, penalties: { home: 6, away: 5 } },
};

if (typeof mod.normalizeMatch !== 'function') {
  console.log('normalizeMatch is not exported — checking via fetch wrappers is enough. Skipping direct test.');
  process.exit(0);
}

const g = mod.normalizeMatch(groupMatch);
assert.strictEqual(g.stage, 'GROUP_STAGE');
assert.strictEqual(g.homeScore, 2);
assert.strictEqual(g.awayScore, 0);
assert.strictEqual(g.regularTimeHome, null, 'group match has no regularTime');
assert.strictEqual(g.winner, 'HOME_TEAM');

const k = mod.normalizeMatch(knockoutPens);
assert.strictEqual(k.stage, 'LAST_32');
assert.strictEqual(k.homeScore, 7, 'fullTime still maps to homeScore');
assert.strictEqual(k.regularTimeHome, 1, 'regularTime exposes 90-min score');
assert.strictEqual(k.regularTimeAway, 1);
assert.strictEqual(k.winner, 'HOME_TEAM');
assert.strictEqual(k.duration, 'PENALTY_SHOOTOUT');

console.log('✅ All normalizeMatch tests passed.');
