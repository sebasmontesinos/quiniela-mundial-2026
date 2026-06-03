/** Deriva el resultado desde los goles. */
export function deriveWinner(homeScore, awayScore) {
  if (homeScore > awayScore) return 'home';
  if (awayScore > homeScore) return 'away';
  return 'draw';
}

/**
 * Puntos: 3 exacto, 1 acierto de resultado, 0 fallo.
 */
export function calculatePoints(prediction, match) {
  const homeScore = match.homeScore;
  const awayScore = match.awayScore;

  if (homeScore == null || awayScore == null) {
    return null;
  }

  const { predictedHomeScore, predictedAwayScore } = prediction;

  if (
    predictedHomeScore === homeScore &&
    predictedAwayScore === awayScore
  ) {
    return 3;
  }

  const actualWinner = deriveWinner(homeScore, awayScore);
  const predictedWinner = deriveWinner(predictedHomeScore, predictedAwayScore);

  if (actualWinner === predictedWinner) {
    return 1;
  }

  return 0;
}
