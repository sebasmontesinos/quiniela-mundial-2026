import assert from 'node:assert';
import { calculatePoints, KNOCKOUT_ADVANCE_BONUS } from '../src/services/scoring.js';

assert.strictEqual(KNOCKOUT_ADVANCE_BONUS, 1);

// --- GROUP STAGE (no 3rd arg) — must behave exactly as before ---
assert.strictEqual(calculatePoints({predictedHomeScore:2,predictedAwayScore:1},{homeScore:2,awayScore:1}), 3, 'exact');
assert.strictEqual(calculatePoints({predictedHomeScore:1,predictedAwayScore:1},{homeScore:1,awayScore:1}), 3, 'exact draw');
assert.strictEqual(calculatePoints({predictedHomeScore:3,predictedAwayScore:3},{homeScore:1,awayScore:1}), 1, 'draw result only');
assert.strictEqual(calculatePoints({predictedHomeScore:2,predictedAwayScore:0},{homeScore:3,awayScore:1}), 1, 'winner only');
assert.strictEqual(calculatePoints({predictedHomeScore:2,predictedAwayScore:1},{homeScore:0,awayScore:1}), 0, 'miss');

// --- KNOCKOUT — score is the 90-minute result the sync passes in ---
// Case: predicted exact draw 1-1, match 1-1 at 90, Home advances, user picked home → 3 + 1
assert.strictEqual(
  calculatePoints({predictedHomeScore:1,predictedAwayScore:1,predictedAdvances:'home'},{homeScore:1,awayScore:1},{isKnockout:true,winner:'HOME_TEAM'}),
  4, 'exact draw + correct advancer');

// Case: predicted exact draw 1-1, match 1-1, Home advances, user picked away → 3 + 0
assert.strictEqual(
  calculatePoints({predictedHomeScore:1,predictedAwayScore:1,predictedAdvances:'away'},{homeScore:1,awayScore:1},{isKnockout:true,winner:'HOME_TEAM'}),
  3, 'exact draw + wrong advancer = no bonus');

// Case: predicted draw 0-0 but match 1-1, correct advancer → 1 (draw result) + 1 bonus
assert.strictEqual(
  calculatePoints({predictedHomeScore:0,predictedAwayScore:0,predictedAdvances:'home'},{homeScore:1,awayScore:1},{isKnockout:true,winner:'HOME_TEAM'}),
  2, 'non-exact draw + correct advancer');

// Case: predicted a winner (not draw) → never gets bonus even in knockout
assert.strictEqual(
  calculatePoints({predictedHomeScore:2,predictedAwayScore:1,predictedAdvances:'home'},{homeScore:2,awayScore:1},{isKnockout:true,winner:'HOME_TEAM'}),
  3, 'predicted winner, no bonus logic');

// Case: predicted draw, but match had a winner at 90 (not a draw) → no bonus, score by normal rules
assert.strictEqual(
  calculatePoints({predictedHomeScore:1,predictedAwayScore:1,predictedAdvances:'home'},{homeScore:2,awayScore:0},{isKnockout:true,winner:'HOME_TEAM'}),
  0, 'predicted draw but match not draw');

// Case: knockout but no predictedAdvances stored → no bonus
assert.strictEqual(
  calculatePoints({predictedHomeScore:1,predictedAwayScore:1},{homeScore:1,awayScore:1},{isKnockout:true,winner:'HOME_TEAM'}),
  3, 'no advances stored, no bonus');

console.log('✅ All scoring tests passed.');
