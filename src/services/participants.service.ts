import { fetchTxHistory, fetchEpochTicks } from "./rpc.service";
import { QubicHelper } from "@qubic-lib/qubic-ts-library/dist/qubicHelper";

const qHelper = new QubicHelper();
const SC_INDEX = 19;

// Input types for raffle deposits
const DEPOSIT_QU_RAFFLE_INPUT_TYPE = 6;
const DEPOSIT_TOKEN_RAFFLE_INPUT_TYPE = 7;

export interface RaffleParticipant {
  wallet: string;
  entryCount: number;
}

/**
 * Get the contract ID for the QRaffle smart contract
 */
async function getContractId(): Promise<string> {
  const destinationPublicKey = new Uint8Array(32);
  destinationPublicKey.fill(0);
  destinationPublicKey[0] = SC_INDEX;
  return await qHelper.getIdentity(destinationPublicKey);
}

const decodeInputBytes = (inputHex: string): Uint8Array | null => {
  if (!inputHex) return null;

  const normalized = inputHex.startsWith("0x") ? inputHex.slice(2) : inputHex;
  if (/^[0-9a-f]+$/i.test(normalized) && normalized.length % 2 === 0) {
    const bytes = new Uint8Array(normalized.length / 2);
    for (let i = 0; i < normalized.length; i += 2) {
      bytes[i / 2] = parseInt(normalized.slice(i, i + 2), 16);
    }
    return bytes;
  }

  try {
    const decoded = atob(inputHex);
    return new Uint8Array([...decoded].map((c) => c.charCodeAt(0)));
  } catch {
    return null;
  }
};

/**
 * Get tick range from archiver status (more reliable)
 */
async function getEpochTickRangeFromArchiverStatus(
  epoch: number,
): Promise<{ startTick: number; endTick: number } | null> {
  try {
    const { fetchArchiverStatus } = await import("@/services/rpc.service");
    const status = await fetchArchiverStatus();
    const interval = status?.processedTickIntervalsPerEpoch?.find((e) => e.epoch === epoch);
    if (interval?.intervals?.length) {
      const startTick = Math.min(...interval.intervals.map((i) => i.initialProcessedTick));
      const endTick = Math.max(...interval.intervals.map((i) => i.lastProcessedTick));
      if (Number.isFinite(startTick) && Number.isFinite(endTick)) return { startTick, endTick };
    }

    const endTick = status?.lastProcessedTicksPerEpoch?.[String(epoch)];
    if (typeof endTick !== "number") return null;

    const prevEndTick = status?.lastProcessedTicksPerEpoch?.[String(epoch - 1)];
    if (typeof prevEndTick !== "number") return null;

    return { startTick: prevEndTick + 1, endTick };
  } catch (error) {
    console.error("Error getting tick range from archiver status:", error);
    return null;
  }
}

/**
 * Get tick range for a specific epoch
 */
async function getEpochTickRange(epoch: number): Promise<{ startTick: number; endTick: number } | null> {
  // Try archiver status first (more reliable)
  const fromStatus = await getEpochTickRangeFromArchiverStatus(epoch);
  if (fromStatus) return fromStatus;

  // Fallback to epoch ticks query
  try {
    const firstPage = await fetchEpochTicks(epoch, 1, 1);
    const lastPage = await fetchEpochTicks(epoch, firstPage.pagination.totalPages, 1);

    if (!firstPage.ticks?.[0] || !lastPage.ticks?.[0]) return null;

    return {
      startTick: firstPage.ticks[0].tickNumber,
      endTick: lastPage.ticks[0].tickNumber,
    };
  } catch (error) {
    console.error("Error getting epoch tick range:", error);
    return null;
  }
}

/**
 * Get all participants for a QUBIC raffle (standard raffle) in a specific epoch
 */
export async function getQuRaffleParticipants(epoch: number): Promise<RaffleParticipant[]> {
  try {
    const contractId = await getContractId();
    const tickRange = await getEpochTickRange(epoch);

    if (!tickRange) {
      console.error("Could not get tick range for epoch:", epoch);
      return [];
    }

    const history = await fetchTxHistory(contractId, tickRange.startTick, tickRange.endTick);
    const ticks = history?.transactions || [];

    // Map to track participant entries
    const participantMap = new Map<string, number>();

    // Iterate through ticks and their transactions
    for (const tick of ticks) {
      for (const txWrapper of tick.transactions) {
        const tx = txWrapper.transaction;
        const moneyFlew = txWrapper.moneyFlew;

        // Check if this is a QUBIC raffle deposit transaction
        if (tx.inputType === DEPOSIT_QU_RAFFLE_INPUT_TYPE && moneyFlew) {
          const sourceId = tx.sourceId;
          participantMap.set(sourceId, (participantMap.get(sourceId) || 0) + 1);
        }
      }
    }

    // Convert map to array and sort by entry count (descending)
    return Array.from(participantMap.entries())
      .map(([wallet, entryCount]) => ({ wallet, entryCount }))
      .sort((a, b) => b.entryCount - a.entryCount);
  } catch (error) {
    console.error("Error fetching QuRaffle participants:", error);
    return [];
  }
}

/**
 * Get all participants for a token raffle in a specific epoch
 */
export async function getTokenRaffleParticipants(epoch: number, tokenRaffleIndex: number): Promise<RaffleParticipant[]> {
  try {
    const contractId = await getContractId();
    const tickRange = await getEpochTickRange(epoch);

    if (!tickRange) {
      console.error("Could not get tick range for epoch:", epoch);
      return [];
    }

    const history = await fetchTxHistory(contractId, tickRange.startTick, tickRange.endTick);
    const ticks = history?.transactions || [];

    // Map to track participant entries
    const participantMap = new Map<string, number>();

    // Iterate through ticks and their transactions
    for (const tick of ticks) {
      for (const txWrapper of tick.transactions) {
        const tx = txWrapper.transaction;
        const moneyFlew = txWrapper.moneyFlew;

        // Check if this is a token raffle deposit transaction
        if (tx.inputType === DEPOSIT_TOKEN_RAFFLE_INPUT_TYPE && moneyFlew) {
          // Parse the input data to get the token raffle index
          // Input payload first 4 bytes are uint32 raffle index (little-endian)
          try {
            const inputBytes = decodeInputBytes(tx.inputHex || "");
            if (!inputBytes || inputBytes.length < 4) continue;
            const view = new DataView(inputBytes.buffer, inputBytes.byteOffset, inputBytes.byteLength);
            const txRaffleIndex = view.getUint32(0, true);

            // Only include if this transaction is for the specified token raffle
            if (txRaffleIndex === tokenRaffleIndex) {
              const sourceId = tx.sourceId;
              participantMap.set(sourceId, (participantMap.get(sourceId) || 0) + 1);
            }
          } catch (parseError) {
            console.error("Error parsing token raffle index from transaction:", parseError);
          }
        }
      }
    }

    // Convert map to array and sort by entry count (descending)
    return Array.from(participantMap.entries())
      .map(([wallet, entryCount]) => ({ wallet, entryCount }))
      .sort((a, b) => b.entryCount - a.entryCount);
  } catch (error) {
    console.error("Error fetching token raffle participants:", error);
    return [];
  }
}

/**
 * Get total unique participants count for a raffle
 */
export function getUniqueParticipantCount(participants: RaffleParticipant[]): number {
  return participants.length;
}

/**
 * Get total entries count for a raffle
 */
export function getTotalEntriesCount(participants: RaffleParticipant[]): number {
  return participants.reduce((sum, p) => sum + p.entryCount, 0);
}
