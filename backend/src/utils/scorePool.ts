/**
 * Generates a random alphanumeric room code.
 */
export function generateRoomCode(length = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Builds a shuffled pool of score assignments.
 * Each entry is [localScore, visitScore].
 */
export function buildScorePool(
  maxLocal: number,
  maxVisit: number,
  allowDuplicates: boolean,
  maxRepetitions: number
): [number, number][] {
  const base: [number, number][] = [];
  for (let x = 0; x <= maxLocal; x++) {
    for (let y = 0; y <= maxVisit; y++) {
      base.push([x, y]);
    }
  }

  const repetitions = allowDuplicates ? maxRepetitions : 1;
  const pool: [number, number][] = [];
  for (let r = 0; r < repetitions; r++) {
    for (const pair of base) {
      pool.push([pair[0], pair[1]]);
    }
  }

  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool;
}

/**
 * Calculates maximum room capacity.
 */
export function calculateCapacity(
  maxLocal: number,
  maxVisit: number,
  allowDuplicates: boolean,
  maxRepetitions: number
): number {
  const base = (maxLocal + 1) * (maxVisit + 1);
  return allowDuplicates ? base * maxRepetitions : base;
}
