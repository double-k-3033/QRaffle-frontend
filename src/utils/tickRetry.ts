import type { TickInfo } from "@/types";

const RETRYABLE_TICK_ERROR_REGEX =
  /rate limit|429|failed to get current tick|tick value is expired|tick value is already in the past|expired|already in the past|timeout|ECONNABORTED|ERR_NETWORK|ERR_BAD_RESPONSE|network error|ECONNRESET|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|socket hang up|fetch failed/i;
const RETRYABLE_TICK_ERROR_CODES = new Set([-32002]);
const RETRYABLE_HTTP_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);
const MAX_ERROR_INSPECTION_DEPTH = 4;

const DEFAULT_MIN_TICK_OFFSET = 8;
const DEFAULT_MAX_TICK_OFFSET = 20;
const DEFAULT_MAX_ATTEMPTS = 4;
const DEFAULT_BACKOFF_STEP_MS = 1500;

export const isRetryableTickError = (error: unknown) => {
  const queue: Array<{ value: unknown; depth: number }> = [{ value: error, depth: 0 }];
  const visited = new Set<unknown>();
  const fragments: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }

    const { value, depth } = current;
    if (value == null || visited.has(value) || depth > MAX_ERROR_INSPECTION_DEPTH) {
      continue;
    }
    visited.add(value);

    if (typeof value === "string") {
      fragments.push(value);
      continue;
    }

    if (typeof value === "number") {
      if (RETRYABLE_TICK_ERROR_CODES.has(value)) {
        return true;
      }
      fragments.push(String(value));
      continue;
    }

    if (value instanceof Error) {
      fragments.push(value.message);
      if (value.cause !== undefined) {
        queue.push({ value: value.cause, depth: depth + 1 });
      }
      continue;
    }

    if (typeof value === "object") {
      const record = value as Record<string, unknown>;
      const retryCode = record.code;

      if (typeof retryCode === "number" && RETRYABLE_TICK_ERROR_CODES.has(retryCode)) {
        return true;
      }

      if (typeof retryCode === "string" && RETRYABLE_TICK_ERROR_REGEX.test(retryCode)) {
        return true;
      }

      const statusCode = record.status ?? (record.response as Record<string, unknown> | undefined)?.status;
      if (typeof statusCode === "number" && RETRYABLE_HTTP_STATUS_CODES.has(statusCode)) {
        return true;
      }

      const keysToInspect = ["message", "error", "details", "reason", "statusText", "data", "cause", "response"];
      for (const key of keysToInspect) {
        if (!(key in record)) {
          continue;
        }

        const nextValue = record[key];
        if (typeof nextValue === "string") {
          fragments.push(nextValue);
        } else {
          queue.push({ value: nextValue, depth: depth + 1 });
        }
      }
      continue;
    }

    fragments.push(String(value));
  }

  const combinedMessage = fragments.join(" | ");
  return RETRYABLE_TICK_ERROR_REGEX.test(combinedMessage);
};

export const getEffectiveTickOffset = (
  tickOffset: number,
  minTickOffset = DEFAULT_MIN_TICK_OFFSET,
  maxTickOffset = DEFAULT_MAX_TICK_OFFSET,
) => {
  const parsedTickOffset = Number(tickOffset);
  const fallbackTickOffset = Math.max(minTickOffset, Math.min(DEFAULT_MIN_TICK_OFFSET, maxTickOffset));

  if (!Number.isFinite(parsedTickOffset)) {
    return fallbackTickOffset;
  }

  return Math.max(minTickOffset, Math.min(parsedTickOffset, maxTickOffset));
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const submitWithFreshTick = async <T>({
  tickOffset,
  fetchTickInfo,
  execute,
  retryContext,
  minTickOffset = DEFAULT_MIN_TICK_OFFSET,
  maxTickOffset = DEFAULT_MAX_TICK_OFFSET,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
}: {
  tickOffset: number;
  fetchTickInfo: () => Promise<TickInfo>;
  execute: (params: { tickInfo: TickInfo; targetTick: number; attempt: number }) => Promise<T>;
  retryContext: string;
  minTickOffset?: number;
  maxTickOffset?: number;
  maxAttempts?: number;
}) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const tickInfo = await fetchTickInfo();
      const effectiveTickOffset = getEffectiveTickOffset(tickOffset, minTickOffset, maxTickOffset);
      const targetTick = tickInfo.tick + effectiveTickOffset;
      const result = await execute({ tickInfo, targetTick, attempt });
      return { tickInfo, targetTick, result };
    } catch (error) {
      const retryable = isRetryableTickError(error);
      if (!retryable || attempt === maxAttempts) {
        throw error;
      }

      const backoffMs = attempt * DEFAULT_BACKOFF_STEP_MS;
      console.warn(
        `[${retryContext}] retrying fresh tx build/sign/broadcast (attempt ${attempt}/${maxAttempts}) in ${backoffMs}ms`,
      );
      await sleep(backoffMs);
    }
  }

  throw new Error(`[${retryContext}] transaction submission failed`);
};
