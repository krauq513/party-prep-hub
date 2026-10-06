import fs from 'fs';
import path from 'path';
import { PartyData } from '@/types/party';
import { INITIAL_PARTY_DATA } from '@/data/initialData';
import { Redis } from '@upstash/redis';

const REDIS_KEY = 'party_prep_hub_data_v1';
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'party-data.json');

// Global in-memory cache fallback for serverless cold start / local
const globalForParty = global as unknown as { partyData?: PartyData };

function getRedisClient(): Redis | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    try {
      return new Redis({ url, token });
    } catch (e) {
      console.warn('Failed to initialize Redis client:', e);
    }
  }
  return null;
}

export async function getPartyData(): Promise<{ data: PartyData; storageType: 'redis' | 'local_file' | 'in_memory' }> {
  // 1. Check Redis (Vercel KV / Upstash)
  const redis = getRedisClient();
  if (redis) {
    try {
      const data = await redis.get<PartyData>(REDIS_KEY);
      if (data) {
        return { data, storageType: 'redis' };
      }
      // If redis is empty, seed it with INITIAL_PARTY_DATA
      await redis.set(REDIS_KEY, INITIAL_PARTY_DATA);
      return { data: INITIAL_PARTY_DATA, storageType: 'redis' };
    } catch (err) {
      console.error('Redis get error, falling back:', err);
    }
  }

  // 2. Local File fallback (Dev environment)
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const data = JSON.parse(raw);
      return { data, storageType: 'local_file' };
    }
  } catch (err) {
    console.warn('Local file read warning:', err);
  }

  // 3. In-memory fallback
  if (globalForParty.partyData) {
    return { data: globalForParty.partyData, storageType: 'in_memory' };
  }

  // Seed default
  globalForParty.partyData = INITIAL_PARTY_DATA;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_PARTY_DATA, null, 2), 'utf-8');
  } catch {
    // Might fail in read-only serverless environment, ignore
  }

  return { data: INITIAL_PARTY_DATA, storageType: 'in_memory' };
}

export async function savePartyData(data: PartyData): Promise<{ success: boolean; storageType: 'redis' | 'local_file' | 'in_memory' }> {
  const updatedData = {
    ...data,
    updatedAt: new Date().toISOString(),
  };

  // 1. Update in-memory
  globalForParty.partyData = updatedData;

  // 2. Update Redis if configured
  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.set(REDIS_KEY, updatedData);
      return { success: true, storageType: 'redis' };
    } catch (err) {
      console.error('Redis save error:', err);
    }
  }

  // 3. Update local file if writable
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(updatedData, null, 2), 'utf-8');
    return { success: true, storageType: 'local_file' };
  } catch {
    // Read-only serverless environment fallback
  }

  return { success: true, storageType: 'in_memory' };
}

export async function resetPartyData(): Promise<PartyData> {
  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.set(REDIS_KEY, INITIAL_PARTY_DATA);
    } catch (err) {
      console.error('Redis reset error:', err);
    }
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_PARTY_DATA, null, 2), 'utf-8');
  } catch {
    // Ignore in read-only serverless
  }

  globalForParty.partyData = INITIAL_PARTY_DATA;
  return INITIAL_PARTY_DATA;
}
