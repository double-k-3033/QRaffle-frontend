export type ParticipationType = "qu" | "token";

export interface Participation {
  type: ParticipationType;
  epoch: number;
  index?: number; // Only for token raffles
}

const STORAGE_PREFIX = "raffle_participations_";

/**
 * Get the storage key for a wallet's participations
 */
function getStorageKey(publicKey: string): string {
  return `${STORAGE_PREFIX}${publicKey}`;
}

/**
 * Get all participations for a wallet
 */
export function getParticipations(publicKey: string): Participation[] {
  if (!publicKey) return [];

  try {
    const key = getStorageKey(publicKey);
    const stored = localStorage.getItem(key);
    if (!stored) return [];

    const participations = JSON.parse(stored) as Participation[];
    return Array.isArray(participations) ? participations : [];
  } catch (error) {
    console.error("Error reading participations from localStorage:", error);
    return [];
  }
}

/**
 * Add a participation for a wallet
 */
export function addParticipation(publicKey: string, participation: Participation): void {
  if (!publicKey) return;

  try {
    const participations = getParticipations(publicKey);

    // Check if participation already exists
    const exists = participations.some((p) => {
      if (p.type !== participation.type) return false;
      if (p.epoch !== participation.epoch) return false;
      if (participation.type === "token" && p.index !== participation.index) return false;
      return true;
    });

    if (!exists) {
      participations.push(participation);
      const key = getStorageKey(publicKey);
      localStorage.setItem(key, JSON.stringify(participations));
    }
  } catch (error) {
    console.error("Error saving participation to localStorage:", error);
  }
}

/**
 * Check if a wallet has participated in a specific raffle
 */
export function hasParticipated(publicKey: string, epoch: number, type: ParticipationType, index?: number): boolean {
  if (!publicKey) return false;

  const participations = getParticipations(publicKey);

  return participations.some((p) => {
    if (p.type !== type) return false;
    if (p.epoch !== epoch) return false;
    if (type === "token" && p.index !== index) return false;
    return true;
  });
}

/**
 * Clear all participations for a wallet (useful for testing or logout)
 */
export function clearParticipations(publicKey: string): void {
  if (!publicKey) return;

  try {
    const key = getStorageKey(publicKey);
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Error clearing participations from localStorage:", error);
  }
}
