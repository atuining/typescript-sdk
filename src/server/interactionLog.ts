import { promises as fs } from 'fs';
import path from 'path';

const LOG_FILE = path.resolve(process.cwd(), 'interaction_log.jsonl');

/**
 * Appends an interaction coupon (and optional extra data) to the log file as a JSONL entry.
 */
export async function logInteractionCoupon(coupon: unknown, extra?: unknown): Promise<void> {
  const entry = extra ? { coupon, extra } : { coupon };
  await fs.appendFile(LOG_FILE, JSON.stringify(entry) + '\n');
} 