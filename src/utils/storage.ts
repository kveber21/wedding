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

export function loadGuestbookEntries(): GuestbookEntry[] {
  try {
    // Also clean up any old demo entries from previous version
    localStorage.removeItem('katia_jf_guestbook_entries_v1');

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Filter out any leftover mock entries by author if present
      const cleaned = parsed.filter(
        (e: GuestbookEntry) =>
          e.author !== "Camille & Thomas" &&
          e.author !== "Tante Martine & Oncle Jacques" &&
          !e.author.includes("Lucas & les Témoins")
      );
      return cleaned;
    }
    return [];
  } catch (err) {
    console.error("Failed to load entries from storage:", err);
    return [];
  }
}

export function saveGuestbookEntries(entries: GuestbookEntry[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    return true;
  } catch (err) {
    console.warn("Storage quota might be exceeded, trying without excessive payload", err);
    try {
      // If photos made it too large, trim photo data or keep most recent
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, 50)));
      return true;
    } catch {
      return false;
    }
  }
}
