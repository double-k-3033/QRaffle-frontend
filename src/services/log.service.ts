import type { IEvent, TickEvents } from "@/types";
import { base64ToUint8Array } from "@/utils";

const CONTRACT_INDEX = 19;

enum EventType {
  QU_TRANSFER = 0,
  ASSET_ISSUANCE = 1,
  ASSET_OWNERSHIP_CHANGE = 2,
  ASSET_POSSESSION_CHANGE = 3,
  CONTRACT_ERROR_MESSAGE = 4,
  CONTRACT_WARNING_MESSAGE = 5,
  CONTRACT_INFORMATION_MESSAGE = 6,
  CONTRACT_DEBUG_MESSAGE = 7,
  BURNING = 8,
  DUST_BURNING = 9,
  SPECTRUM_STATS = 10,
  ASSET_OWNERSHIP_MANAGING_CONTRACT_CHANGE = 11,
  ASSET_POSSESSION_MANAGING_CONTRACT_CHANGE = 12,
  CUSTOM_MESSAGE = 255,
}

enum QRAFFLE_LOGS {
  SUCCESS = 0,
  INSUFFICIENT_QUBIC = 1,
  INSUFFICIENT_QXMR = 2,
  ALREADY_REGISTERED = 3,
  UNREGISTERED = 4,
  MAX_MEMBER_REACHED = 5,
  MAX_PROPOSAL_EPOCH_REACHED = 6,
  INVALID_PROPOSAL = 7,
  FAILED_TO_DEPOSIT = 8,
  ALREADY_VOTED = 9,
  INVALID_TOKEN_RAFFLE = 10,
  INVALID_OFFSET_OR_LIMIT = 11,
  INVALID_EPOCH = 12,
  INITIAL_REGISTER_CANNOT_LOGOUT = 13,
  INVALID_TOKEN_TYPE = 14,
  INVALID_ENTRY_AMOUNT = 15,
  MAX_MEMBER_REACHED_FOR_QU_RAFFLE = 16,
  PROPOSAL_NOT_FOUND = 17,
  PROPOSAL_ALREADY_ENDED = 18,
  NOT_ENOUGH_SHARES = 19,
  TRANSFER_FAILED = 20,
  EPOCH_ENDED = 21,
  WINNER_SELECTED = 22,
  REVENUE_DISTRIBUTED = 23,
  TOKEN_RAFFLE_CREATED = 24,
  TOKEN_RAFFLE_ENDED = 25,
  PROPOSAL_SUBMITTED = 26,
  PROPOSAL_VOTED = 27,
  QU_RAFFLE_DEPOSITED = 28,
  TOKEN_RAFFLE_DEPOSITED = 29,
  SHARE_MANAGEMENT_RIGHTS_TRANSFERRED = 30,
  EMPTY_QU_RAFFLE = 31,
  EMPTY_TOKEN_RAFFLE = 32,
}

const checkSCLog = (event: IEvent) => {
  let result = false;
  if (
    event.eventType === EventType.CONTRACT_ERROR_MESSAGE ||
    event.eventType === EventType.CONTRACT_WARNING_MESSAGE ||
    event.eventType === EventType.CONTRACT_INFORMATION_MESSAGE ||
    event.eventType === EventType.CONTRACT_DEBUG_MESSAGE
  ) {
    result = true;
  }
  return result;
};

const decodeLogHeader = (eventData: string) => {
  const eventDataArray = base64ToUint8Array(eventData);
  const dataView = new DataView(eventDataArray.buffer);
  const SCIdx = dataView.getUint32(0, true);
  const eventType = dataView.getUint32(4, true);

  return { contractIdx: SCIdx, logType: QRAFFLE_LOGS[eventType] };
};

const decodeLogBody = (_eventData: string, _logType: keyof typeof QRAFFLE_LOGS) => {
  // const eventDataArray = base64ToUint8Array(eventData);
  // const dataView = new DataView(eventDataArray.buffer);

  //   switch (logType) {
  //     case "SUCCESS":
  //       return {}; // Cutomize for other contracts
  //     default:
  //       return {};
  //   }

  // QRAFFLE logs doesnt have any body data
  return {};
};

const decodeQraffleLog = async (log: TickEvents) => {
  const result: any[] = [];

  for (const tx of log.txEvents) {
    for (const event of tx.events) {
      const isSCLog = checkSCLog(event);
      if (!isSCLog) continue;

      const { contractIdx, logType } = decodeLogHeader(event.eventData);
      if (contractIdx !== CONTRACT_INDEX) continue;

      const eventData = decodeLogBody(event.eventData, logType as keyof typeof QRAFFLE_LOGS);
      if (eventData) {
        result.push({
          tick: log.tick,
          eventId: Number(event.header.eventId),
          logType,
          ...eventData,
        });
      }
    }
  }

  return result;
};

export { decodeQraffleLog };
