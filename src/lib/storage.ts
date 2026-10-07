import fs from 'fs';
import path from 'path';
import { PartyData, CustomSubItem } from '@/types/party';
import { INITIAL_PARTY_DATA } from '@/data/initialData';
import { Redis } from '@upstash/redis';
import { put, list, del } from '@vercel/blob';

const SNAPSHOT_PREFIX = 'party-snapshots/';
const LEGACY_BLOB_FILENAME = 'party-data-v1.json';
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

export async function getPartyData(): Promise<{ data: PartyData; storageType: 'blob' | 'redis' | 'local_file' | 'in_memory' }> {
  // 1. Check Vercel Blob (Primary for Vercel production)
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      // Look for immutable timestamped snapshots first (guaranteed zero CDN cache lag)
      const { blobs: snapshotBlobs } = await list({ prefix: SNAPSHOT_PREFIX });
      let targetBlobUrl: string | null = null;

      if (snapshotBlobs && snapshotBlobs.length > 0) {
        const sorted = [...snapshotBlobs].sort(
          (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        );
        targetBlobUrl = sorted[0].url;
      } else {
        // Fallback to legacy single file
        const { blobs: legacyBlobs } = await list({ prefix: LEGACY_BLOB_FILENAME });
        if (legacyBlobs && legacyBlobs.length > 0) {
          const sorted = [...legacyBlobs].sort(
            (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
          );
          targetBlobUrl = sorted[0].url;
        }
      }

      if (targetBlobUrl) {
        // Fetch with aggressive cache-busting headers
        const res = await fetch(`${targetBlobUrl}?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
          },
        });
        if (res.ok) {
          const data: PartyData = await res.json();
          if (data && data.items) {
            // Guarantee Lee Ah-reum's Rummikub is preserved
            const boardGameItem = data.items.find((i) => i.id === 'item-6' || i.name.includes('보드게임'));
            if (boardGameItem) {
              const hasRummikub = (boardGameItem.boardGames || []).some((bg) => bg.gameName.includes('루미큐브'));
              if (!hasRummikub) {
                const initBg = INITIAL_PARTY_DATA.items.find((i) => i.id === 'item-6');
                if (initBg?.boardGames && initBg.boardGames.length > 0) {
                  boardGameItem.boardGames = [...(boardGameItem.boardGames || []), ...initBg.boardGames];
                  const existingAssigneeIds = new Set((boardGameItem.assignees || []).map((a) => a.id));
                  for (const a of initBg.assignees || []) {
                    if (!existingAssigneeIds.has(a.id)) {
                      boardGameItem.assignees = [...(boardGameItem.assignees || []), a];
                    }
                  }
                  boardGameItem.isCompleted = true;
                }
              }
            }
            // Auto-migrate 양주 -> 칵테일
            const cocktailItem = data.items.find((i) => i.id === 'item-32' || i.name === '양주');
            if (cocktailItem && cocktailItem.name === '양주') {
              cocktailItem.name = '칵테일';
              cocktailItem.notes = '하이볼, 칵테일 제조용 주류/베이스 🍸 찜하기 및 종류 등록 환영!';
            }

            // Clean up any stray boardGames on non-board-game items (e.g. 칵테일) and migrate to subItems
            data.items = data.items.map((i) => {
              if (!i.name.includes('보드게임') && i.boardGames && i.boardGames.length > 0) {
                const existingSubNames = new Set((i.subItems || []).map((s) => s.name.toLowerCase()));
                const subsFromGames: CustomSubItem[] = i.boardGames
                  .filter((bg) => !existingSubNames.has(bg.gameName.toLowerCase()))
                  .map((bg) => ({
                    id: bg.id,
                    name: bg.gameName,
                    participantId: bg.participantId,
                    participantName: bg.participantName,
                    createdAt: bg.createdAt,
                  }));
                return {
                  ...i,
                  subItems: [...(i.subItems || []), ...subsFromGames],
                  boardGames: [],
                };
              }
              return i;
            });

            // If in-memory data has a strictly newer timestamp, use in-memory
            if (
              globalForParty.partyData?.updatedAt &&
              data.updatedAt &&
              new Date(globalForParty.partyData.updatedAt) > new Date(data.updatedAt)
            ) {
              return { data: globalForParty.partyData, storageType: 'in_memory' };
            }

            globalForParty.partyData = data;
            return { data, storageType: 'blob' };
          }
        }
      } else {
        // Initialize Blob with INITIAL_PARTY_DATA
        await savePartyData(INITIAL_PARTY_DATA);
        globalForParty.partyData = INITIAL_PARTY_DATA;
        return { data: INITIAL_PARTY_DATA, storageType: 'blob' };
      }
    } catch (err) {
      console.error('Vercel Blob get error, falling back:', err);
    }
  }

  // 2. Check Redis (Vercel KV / Upstash)
  const redis = getRedisClient();
  if (redis) {
    try {
      const data = await redis.get<PartyData>(REDIS_KEY);
      if (data) {
        if (!data.location || data.location === '파티 플레이스' || data.location === '파티플레이스') {
          data.location = '다큐하우스 펜션';
          await redis.set(REDIS_KEY, data);
        }
        return { data, storageType: 'redis' };
      }
      await redis.set(REDIS_KEY, INITIAL_PARTY_DATA);
      return { data: INITIAL_PARTY_DATA, storageType: 'redis' };
    } catch (err) {
      console.error('Redis get error, falling back:', err);
    }
  }

  // 3. Local File fallback (Dev environment)
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (!data.location || data.location === '파티 플레이스' || data.location === '파티플레이스') {
        data.location = '다큐하우스 펜션';
      }
      return { data, storageType: 'local_file' };
    }
  } catch (err) {
    console.warn('Local file read warning:', err);
  }

  // 4. In-memory fallback
  if (globalForParty.partyData) {
    if (!globalForParty.partyData.location || globalForParty.partyData.location === '파티 플레이스' || globalForParty.partyData.location === '파티플레이스') {
      globalForParty.partyData.location = '다큐하우스 펜션';
    }
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

export async function savePartyData(data: PartyData): Promise<{ success: boolean; storageType: 'blob' | 'redis' | 'local_file' | 'in_memory' }> {
  const updatedData: PartyData = {
    ...data,
    updatedAt: new Date().toISOString(),
  };

  // 1. Update in-memory
  globalForParty.partyData = updatedData;

  // 2. Save to Vercel Blob (Primary for Vercel production)
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const snapshotName = `${SNAPSHOT_PREFIX}data-${Date.now()}.json`;
      await put(snapshotName, JSON.stringify(updatedData, null, 2), {
        access: 'public',
        addRandomSuffix: false,
        cacheControlMaxAge: 0,
      });

      // Keep legacy file updated with cacheControlMaxAge: 0 for backward compatibility
      put(LEGACY_BLOB_FILENAME, JSON.stringify(updatedData, null, 2), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        cacheControlMaxAge: 0,
      }).catch(() => {});

      // Asynchronously prune older snapshots (retain newest 5)
      list({ prefix: SNAPSHOT_PREFIX })
        .then(({ blobs }) => {
          if (blobs && blobs.length > 5) {
            const sorted = [...blobs].sort(
              (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
            );
            const toDelete = sorted.slice(5).map((b) => b.url);
            if (toDelete.length > 0) del(toDelete).catch(() => {});
          }
        })
        .catch(() => {});

      return { success: true, storageType: 'blob' };
    } catch (err) {
      console.error('Vercel Blob save error:', err);
    }
  }

  // 3. Update Redis if configured
  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.set(REDIS_KEY, updatedData);
      return { success: true, storageType: 'redis' };
    } catch (err) {
      console.error('Redis save error:', err);
    }
  }

  // 4. Update local file if writable
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
  await savePartyData(INITIAL_PARTY_DATA);

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
