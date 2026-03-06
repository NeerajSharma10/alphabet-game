export const GAME_MODES = {
  english: {
    id: 'english',
    label: 'English ABC',
    icon: '\uD83D\uDD24',
    characters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
    specialChars: ['@', '#', '$', '!', '?', '&', '*', '+', '%', '~'],
    ranges: [
      { id: 'A-F', label: 'A - F', count: 6, slice: [0, 6] },
      { id: 'A-M', label: 'A - M', count: 13, slice: [0, 13] },
      { id: 'A-Z', label: 'A - Z', count: 26, slice: [0, 26] },
    ],
  },
  numbers: {
    id: 'numbers',
    label: 'Numbers',
    icon: '\uD83D\uDD22',
    characters: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    specialChars: ['@', '#', '$', '!', '?', '&', '*', '+', '%', '~'],
    ranges: [
      { id: '1-5', label: '1 - 5', count: 5, slice: [0, 5] },
      { id: '1-10', label: '1 - 10', count: 10, slice: [0, 10] },
    ],
  },
  hindi: {
    id: 'hindi',
    label: 'Hindi Swar',
    icon: '\uD83C\uDDEE\uD83C\uDDF3',
    characters: [
      '\u0905', '\u0906', '\u0907', '\u0908',
      '\u0909', '\u090A', '\u090F', '\u0910',
      '\u0913', '\u0914', '\u0905\u0902', '\u0905\u0903',
    ],
    specialChars: ['@', '#', '$', '!', '?', '&', '*', '+', '%', '~'],
    ranges: [
      { id: 'first6', label: 'First 6', count: 6, slice: [0, 6] },
      { id: 'all12', label: 'All 12', count: 12, slice: [0, 12] },
    ],
  },
};

export const DIFFICULTIES = {
  easy: {
    id: 'easy',
    label: 'Easy',
    icon: '\uD83C\uDF1F',
    travelTimeBase: 5500,
    travelTimeDecrease: 60,
    travelTimeMin: 3500,
    spawnInterval: 1500,
    hitZoneGrabMin: 0.55,
    hitZoneGrabMax: 0.95,
  },
  medium: {
    id: 'medium',
    label: 'Medium',
    icon: '\u2B50',
    travelTimeBase: 4500,
    travelTimeDecrease: 80,
    travelTimeMin: 2500,
    spawnInterval: 1200,
    hitZoneGrabMin: 0.65,
    hitZoneGrabMax: 0.95,
  },
  hard: {
    id: 'hard',
    label: 'Hard',
    icon: '\uD83D\uDD25',
    travelTimeBase: 3500,
    travelTimeDecrease: 100,
    travelTimeMin: 1800,
    spawnInterval: 900,
    hitZoneGrabMin: 0.70,
    hitZoneGrabMax: 0.90,
  },
};

export const MODE_ORDER = ['english', 'numbers', 'hindi'];
export const DIFFICULTY_ORDER = ['easy', 'medium', 'hard'];

export function buildGameConfig(modeId, rangeId, difficultyId) {
  const mode = GAME_MODES[modeId];
  const range = mode.ranges.find((r) => r.id === rangeId);
  const difficulty = DIFFICULTIES[difficultyId];
  const characters = mode.characters.slice(range.slice[0], range.slice[1]);

  return {
    modeId,
    rangeId,
    difficultyId,
    label: mode.label,
    characters,
    specialChars: mode.specialChars,
    totalCount: characters.length,
    scoreKey: `${modeId}_${rangeId}_${difficultyId}`,
    travelTimeBase: difficulty.travelTimeBase,
    travelTimeDecrease: difficulty.travelTimeDecrease,
    travelTimeMin: difficulty.travelTimeMin,
    spawnInterval: difficulty.spawnInterval,
    hitZoneGrabMin: difficulty.hitZoneGrabMin,
    hitZoneGrabMax: difficulty.hitZoneGrabMax,
  };
}
