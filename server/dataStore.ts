import fs from 'fs';
import path from 'path';
import { GuestbookEntry } from '../src/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'guestbook-entries.json');

function loadEntriesFromDisk(): GuestbookEntry[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading guestbook data from disk:', err);
  }
  return [];
}

function saveEntriesToDisk(entries: GuestbookEntry[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(entries, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving guestbook data to disk:', err);
  }
}

// In-memory array backed by persistent disk storage
let sharedEntries: GuestbookEntry[] = loadEntriesFromDisk();

export function getSharedEntries(): GuestbookEntry[] {
  return sharedEntries;
}

export function addSharedEntry(entry: GuestbookEntry): GuestbookEntry {
  const existingIndex = sharedEntries.findIndex((e) => String(e.id) === String(entry.id));
  if (existingIndex >= 0) {
    const current = sharedEntries[existingIndex];
    const reactions = {
      heart: Math.max(current.reactions?.heart || 0, entry.reactions?.heart || 0),
      toast: Math.max(current.reactions?.toast || 0, entry.reactions?.toast || 0),
      lemon: Math.max(current.reactions?.lemon || 0, entry.reactions?.lemon || 0),
      sparkle: Math.max(current.reactions?.sparkle || 0, entry.reactions?.sparkle || 0),
    };
    sharedEntries[existingIndex] = { ...entry, reactions };
  } else {
    sharedEntries = [entry, ...sharedEntries];
  }
  saveEntriesToDisk(sharedEntries);
  return entry;
}

export function updateSharedEntryReactions(
  id: string,
  reactions: GuestbookEntry['reactions']
): GuestbookEntry | null {
  const item = sharedEntries.find((e) => String(e.id) === String(id));
  if (!item) {
    // If entry isn't found yet (e.g. race condition), create stub so reactions are never lost
    const newStub: GuestbookEntry = {
      id,
      author: 'Invité',
      message: '',
      date: `${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
      timestamp: Number(id) || Date.now(),
      reactions,
    };
    sharedEntries = [newStub, ...sharedEntries];
    saveEntriesToDisk(sharedEntries);
    return newStub;
  }
  item.reactions = reactions;
  saveEntriesToDisk(sharedEntries);
  return item;
}

export function deleteSharedEntry(id: string | number): boolean {
  const initialLength = sharedEntries.length;
  sharedEntries = sharedEntries.filter((e) => String(e.id) !== String(id));
  if (sharedEntries.length < initialLength) {
    saveEntriesToDisk(sharedEntries);
    return true;
  }
  return false;
}
