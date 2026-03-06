export const SPECIAL_CHARS = ['@', '#', '$', '!', '?', '&', '*', '+', '%', '~'];

export const SCORING = {
  CORRECT: 10,
  WRONG_ALPHABET: -5,
};

export const MAX_STRIKES = 3;

// Combo system
export const COMBO = {
  MAX_MULTIPLIER: 5,
  THRESHOLDS: [0, 3, 6, 10, 15], // x1 at 0, x2 at 3, x3 at 6, x4 at 10, x5 at 15
};

export function getComboMultiplier(consecutiveCorrect) {
  const { THRESHOLDS, MAX_MULTIPLIER } = COMBO;
  let multiplier = 1;
  for (let i = THRESHOLDS.length - 1; i >= 0; i--) {
    if (consecutiveCorrect >= THRESHOLDS[i]) {
      multiplier = i + 1;
      break;
    }
  }
  return Math.min(multiplier, MAX_MULTIPLIER);
}

// Lane / highway layout (same for all modes)
export const LANE_COUNT = 3;
export const VANISHING_POINT_Y = 0.10;
export const HIT_ZONE_Y = 0.82;
export const LANE_POSITIONS_BOTTOM = [0.18, 0.50, 0.82];

export const LETTER_SCALE_START = 0.25;
export const LETTER_SCALE_END = 1.1;

export function assignLane() {
  return Math.floor(Math.random() * LANE_COUNT);
}

// Generate a random letter. ~20% chance to spawn the next needed character.
export function generateRandomLetter(nextExpected, characters, specialChars) {
  if (nextExpected && Math.random() < 0.20) {
    return nextExpected;
  }
  const pool = [...characters, ...specialChars, ...specialChars];
  return pool[Math.floor(Math.random() * pool.length)];
}

// Check if char is a valid (correct) character in the active set
export function isValidChar(char, characters) {
  return characters.includes(char);
}

// Check if char is a curse/special character
export function isSpecialChar(char, specialChars) {
  return specialChars.includes(char);
}
