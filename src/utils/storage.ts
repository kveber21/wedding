export const INITIAL_QUESTIONS = [
  "Une anecdote amusante sur les mariés pendant la soirée ?",
  "Un mot doux ou un souhait pour notre avenir ?",
  "Un souvenir marquant du mariage que vous souhaitez partager ?"
];

import { createClient } from '@supabase/supabase-js';
import { GuestbookEntry } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function loadLocalGuestbookEntries(): GuestbookEntry[] {
  return [];
}

export async function fetchSharedGuestbookEntries(): Promise<GuestbookEntry[]> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Erreur Supabase:', error);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      author: row.author,
      message: row.message,
      date: row.date,
      timestamp: row.timestamp,
      isPrivate: row.is_private,
      photos: row.photos,
      reactions: row.reactions || { heart: 1, sparkle: 1 }
    }));
  } catch (e) {
    console.error(e);
    return [];
  }
}

export async function createSharedGuestbookEntry(entry: GuestbookEntry): Promise<void> {
  try {
    await supabase.from('messages').insert([
      {
        id: entry.id,
        author: entry.author,
        message: entry.message,
        date: entry.date,
        timestamp: entry.timestamp,
        is_private: entry.isPrivate || false,
        photos: entry.photos || null,
        reactions: entry.reactions
      }
    ]);
  } catch (e) {
    console.error('Erreur création Supabase:', e);
  }
}

export async function updateSharedReaction(
  id: string | number,
  reactions: GuestbookEntry['reactions']
): Promise<void> {
  try {
    await supabase
      .from('messages')
      .update({ reactions })
      .eq('id', id);
  } catch (e) {
    console.error(e);
  }
}

export async function deleteSharedGuestbookEntry(id: string | number): Promise<void> {
  try {
    await supabase
      .from('messages')
      .delete()
      .eq('id', id);
  } catch (e) {
    console.error(e);
  }
}
