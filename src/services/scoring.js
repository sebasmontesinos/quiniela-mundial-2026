export const KNOCKOUT_ADVANCE_BONUS = 1;

/** Deriva el resultado desde los goles. */
export function deriveWinner(homeScore, awayScore) {
  if (homeScore > awayScore) return 'home';
  if (awayScore > homeScore) return 'away';
  return 'draw';
}

/**
 * Puntos: 3 exacto, 1 acierto de resultado, 0 fallo.
 */
export function calculatePoints(prediction, match, knockout = null) {
  const homeScore = match.homeScore;
  const awayScore = match.awayScore;

  if (homeScore == null || awayScore == null) {
    return null;
  }

  const { predictedHomeScore, predictedAwayScore } = prediction;

  let points;
  if (predictedHomeScore === homeScore && predictedAwayScore === awayScore) {
    points = 3;
  } else {
    const actualWinner = deriveWinner(homeScore, awayScore);
    const predictedWinner = deriveWinner(predictedHomeScore, predictedAwayScore);
    points = actualWinner === predictedWinner ? 1 : 0;
  }

  if (knockout && knockout.isKnockout) {
    const predictedDraw = predictedHomeScore === predictedAwayScore;
    const actualDraw = homeScore === awayScore;
    if (predictedDraw && actualDraw && prediction.predictedAdvances) {
      let advancedSide = null;
      if (knockout.winner === 'HOME_TEAM') advancedSide = 'home';
      else if (knockout.winner === 'AWAY_TEAM') advancedSide = 'away';
      if (advancedSide && prediction.predictedAdvances === advancedSide) {
        points += KNOCKOUT_ADVANCE_BONUS;
      }
    }
  }

  return points;
}
