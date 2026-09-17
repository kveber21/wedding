import { GuestbookEntry } from '../types';

const STORAGE_KEY = 'katia_jf_guestbook_entries_v2';

export const INITIAL_QUESTIONS = [
  "Raconte la meilleure anecdote du mariage !",
  "Comment as-tu vécu cette journée de mariage ?",
  "Quel est ton meilleur souvenir avec nous ?",
  "Quelle est la plus belle chose que tu puisses nous souhaiter ?",
  "Un conseil infaillible pour un mariage heureux ?",
  "Si tu devais résumer notre histoire en 3 mots ?",
  "Des vœux à nous souhaiter pour nos 10 ans de mariage ?"
];

export const INITIAL_ENTRIES: GuestbookEntry[] = [];

/**
 * Loads entries from the shared server database, with fallback/merge from localStorage.
 */
export async function fetchSharedGuestbookEntries(): Promise<GuestbookEntry[]> {
  const localEntries = loadLocalGuestbookEntries();

  try {
    const res = await fetch('/api/entries');
    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }
    const data = await res.json();
    const serverEntries: GuestbookEntry[] = (data.entries || []).map((e: any, idx: number) => ({
      ...e,
      id: e.id !== undefined && e.id !== null && e.id !== '' ? e.id : `srv-${Date.now()}-${idx}`
    }));

    // Merge: ensure any local entries not yet on server get merged, and reactions are preserved
    const combinedMap = new Map<string, GuestbookEntry>();
    for (const e of serverEntries) {
      combinedMap.set(String(e.id), e);
    }
    for (const e of localEntries) {
      const entryId = e.id !== undefined && e.id !== null && e.id !== '' ? e.id : `loc-${Date.now()}`;
      const normalizedEntry = { ...e, id: entryId };
      const existing = combinedMap.get(String(entryId));
      if (!existing) {
        combinedMap.set(String(entryId), normalizedEntry);
        // Silently sync missing local entry to server
        syncEntryToServer(normalizedEntry).catch(() => {});
      } else {
        // Merge reactions using the highest count between server and local
        const mergedReactions = {
          heart: Math.max(existing.reactions?.heart || 0, e.reactions?.heart || 0),
          toast: Math.max(existing.reactions?.toast || 0, e.reactions?.toast || 0),
          lemon: Math.max(existing.reactions?.lemon || 0, e.reactions?.lemon || 0),
          sparkle: Math.max(existing.reactions?.sparkle || 0, e.reactions?.sparkle || 0),
        };
        combinedMap.set(String(e.id), {
          ...existing,
          reactions: mergedReactions,
        });
      }
    }

    const merged = Array.from(combinedMap.values());
    // Sort by timestamp desc
    merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Update local cache
    saveLocalGuestbookEntries(merged);
    return merged;
  } catch (err) {
    console.warn('Could not reach backend server, using local storage cache:', err);
    return localEntries;
  }
}

/**
 * Saves a new entry to the shared backend database and caches locally.
 */
export async function createSharedGuestbookEntry(entry: GuestbookEntry): Promise<boolean> {
  // Save locally first for instant feedback and offline support
  const local = loadLocalGuestbookEntries();
  const updated = [entry, ...local.filter((e) => e.id !== entry.id)];
  saveLocalGuestbookEntries(updated);

  return syncEntryToServer(entry);
}

async function syncEntryToServer(entry: GuestbookEntry): Promise<boolean> {
  try {
    const res = await fetch('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    return res.ok;
  } catch (err) {
    console.warn('Failed to sync entry to server:', err);
    return false;
  }
}

/**
 * Syncs reaction counts to the shared backend
 */
export async function updateSharedReaction(
  entryId: string | number,
  reactions: GuestbookEntry['reactions']
): Promise<void> {
  // Update locally first
  const local = loadLocalGuestbookEntries();
  const updated = local.map((e) => {
    if (String(e.id) === String(entryId)) {
      return { ...e, reactions };
    }
    return e;
  });
  saveLocalGuestbookEntries(updated);

  try {
    await fetch(`/api/entries/${entryId}/reactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reactions }),
    });
  } catch (err) {
    console.warn('Failed to sync reactions to server:', err);
  }
}

/**
 * Deletes an entry from both local storage and the shared server database
 */
export async function deleteSharedGuestbookEntry(id: string | number): Promise<boolean> {
  const local = loadLocalGuestbookEntries();
  const updated = local.filter((e) => String(e.id) !== String(id));
  saveLocalGuestbookEntries(updated);

  try {
    const res = await fetch(`/api/entries/${id}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.warn('Failed to delete entry from server:', err);
    return false;
  }
}

/**
 * Synchronous local storage reader (used as initial state)
 */
export function loadLocalGuestbookEntries(): GuestbookEntry[] {
  try {
    localStorage.removeItem('katia_jf_guestbook_entries_v1');
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (e: GuestbookEntry) =>
          e.author !== 'Camille & Thomas' &&
          e.author !== 'Tante Martine & Oncle Jacques' &&
          !e.author.includes('Lucas & les Témoins')
      );
    }
    return [];
  } catch (err) {
    console.error('Failed to load entries from storage:', err);
    return [];
  }
}

export function saveLocalGuestbookEntries(entries: GuestbookEntry[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    return true;
  } catch {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, 50)));
      return true;
    } catch {
      return false;
    }
  }
}
