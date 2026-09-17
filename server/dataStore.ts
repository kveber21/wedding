import { GuestbookEntry } from '../src/types';

// In-memory array shared across all clients on this server instance
let sharedEntries: GuestbookEntry[] = [];

export function getSharedEntries(): GuestbookEntry[] {
  return sharedEntries;
}

export function addSharedEntry(entry: GuestbookEntry): GuestbookEntry {
  // Prevent exact duplicate ID
  const existingIndex = sharedEntries.findIndex((e) => String(e.id) === String(entry.id));
  if (existingIndex >= 0) {
    sharedEntries[existingIndex] = entry;
  } else {
    sharedEntries = [entry, ...sharedEntries];
  }
  return entry;
}

export function updateSharedEntryReactions(
  id: string,
  reactions: GuestbookEntry['reactions']
): GuestbookEntry | null {
  const item = sharedEntries.find((e) => String(e.id) === String(id));
  if (!item) return null;
  item.reactions = reactions;
  return item;
}
