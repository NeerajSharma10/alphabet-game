import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'best_score_';

export async function getBestScore(scoreKey) {
  try {
    const value = await AsyncStorage.getItem(PREFIX + scoreKey);
    return value !== null ? parseInt(value, 10) : null;
  } catch (e) {
    console.warn('Failed to read best score:', e);
    return null;
  }
}

// Game stats
const STATS_KEY = 'game_stats';

const DEFAULT_STATS = {
  totalGamesPlayed: 0,
  totalCorrectCatches: 0,
  longestComboEver: 0,
  totalScoreAllGames: 0,
};

export async function getStats() {
  try {
    const json = await AsyncStorage.getItem(STATS_KEY);
    if (json) return { ...DEFAULT_STATS, ...JSON.parse(json) };
    return { ...DEFAULT_STATS };
  } catch (e) {
    console.warn('Failed to read stats:', e);
    return { ...DEFAULT_STATS };
  }
}

export async function updateStats({ score, correctCatches, maxCombo }) {
  try {
    const stats = await getStats();
    stats.totalGamesPlayed += 1;
    stats.totalCorrectCatches += correctCatches;
    stats.totalScoreAllGames += Math.max(0, score);
    if (maxCombo > stats.longestComboEver) {
      stats.longestComboEver = maxCombo;
    }
    await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
    return stats;
  } catch (e) {
    console.warn('Failed to update stats:', e);
    return null;
  }
}

export async function saveBestScore(scoreKey, score) {
  try {
    const current = await getBestScore(scoreKey);
    if (current === null || score > current) {
      await AsyncStorage.setItem(PREFIX + scoreKey, String(score));
      return { isNewBest: true, bestScore: score };
    }
    return { isNewBest: false, bestScore: current };
  } catch (e) {
    console.warn('Failed to save best score:', e);
    return { isNewBest: false, bestScore: score };
  }
}
