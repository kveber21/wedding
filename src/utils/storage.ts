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
    const serverEntries: GuestbookEntry[] = data.entries || [];

    // Merge: ensure any local entries not yet on server get merged
    const combinedMap = new Map<string, GuestbookEntry>();
    for (const e of serverEntries) {
      combinedMap.set(String(e.id), e);
    }
    for (const e of localEntries) {
      if (!combinedMap.has(String(e.id))) {
        combinedMap.set(String(e.id), e);
        // Silently sync missing local entry to server
        syncEntryToServer(e).catch(() => {});
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
  entryId: string,
  reactions: GuestbookEntry['reactions']
): Promise<void> {
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
