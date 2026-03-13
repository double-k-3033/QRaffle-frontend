export interface TickEvents {
  tick: number;
  txEvents: {
    txId: string;
    events: IEvent[];
  }[];
}

export interface IEvent {
  header: {
    epoch: number;
    tick: number;
    tmp: number;
    eventId: string;
    eventDigest: string;
  };
  eventType: number;
  eventSize: number;
  eventData: string;
}
