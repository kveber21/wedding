import { useState, useEffect } from 'react';
import { GuestbookForm } from './components/GuestbookForm';
import { GuestbookList } from './components/GuestbookList';
import { PhotoLightbox } from './components/PhotoLightbox';
import { PinModal } from './components/PinModal';
import { GuestbookEntry, PhotoAttachment } from './types';
import { loadGuestbookEntries, saveGuestbookEntries } from './utils/storage';
import { Heart } from 'lucide-react';

export default function App() {
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [activeLightbox, setActiveLightbox] = useState<{
    photos: PhotoAttachment[];
    index: number;
  } | null>(null);

  // PIN security for private messages
  const [isPinUnlocked, setIsPinUnlocked] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('kjmariage_unlocked') === 'true';
    }
    return false;
  });
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  // Load entries on mount
  useEffect(() => {
    const loaded = loadGuestbookEntries();
    setEntries(loaded);
  }, []);

  const handleUnlockPinSuccess = () => {
    setIsPinUnlocked(true);
    try {
      sessionStorage.setItem('kjmariage_unlocked', 'true');
    } catch {
      // Ignore
    }
  };

  const handleLockPin = () => {
    setIsPinUnlocked(false);
    try {
      sessionStorage.removeItem('kjmariage_unlocked');
    } catch {
      // Ignore
    }
  };

  // Save when entries update
  const handleAddEntry = (author: string, message: string, photos: PhotoAttachment[], isPrivate: boolean) => {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const newEntry: GuestbookEntry = {
      id: Date.now(),
      author,
      message,
      date: formattedDate,
      timestamp: Date.now(),
      isPrivate: isPrivate || undefined,
      photos: photos.length > 0 ? photos : undefined,
      reactions: {
        heart: 1,
        sparkle: 1
      }
    };

    const updated = [newEntry, ...entries];
    setEntries(updated);
    saveGuestbookEntries(updated);
  };

  const handleAddReaction = (id: string | number, reactionType: 'heart' | 'toast' | 'lemon' | 'sparkle') => {
    setEntries((prev) => {
      const next = prev.map((entry) => {
        if (entry.id === id) {
          const reactions = entry.reactions || {};
          return {
            ...entry,
            reactions: {
              ...reactions,
              [reactionType]: (reactions[reactionType] || 0) + 1
            }
          };
        }
        return entry;
      });
      saveGuestbookEntries(next);
      return next;
    });
  };

  const handleOpenPhoto = (photos: PhotoAttachment[], index: number) => {
    setActiveLightbox({ photos, index });
  };

  const handleExportSouvenirs = () => {
    const exportData = {
      title: "Contribue à nos souvenirs de mariage - Katia & Jean-François",
      weddingDate: "25 Juillet 2026",
      mailbox: "k.jf.mariage@gmail.com",
      exportedAt: new Date().toISOString(),
      totalEntries: entries.length,
      entries: entries.map(e => ({
        auteur: e.author,
        date: e.date,
        statut: e.isPrivate ? "Réservé uniquement aux mariés (Privé)" : "Public",
        message: e.message,
        photosCount: e.photos?.length || 0
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `souvenirs-mariage-katia-jean-francois-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen tile-pattern pb-16">
      <main className="max-w-3xl mx-auto px-4 pt-8">
        {/* Intro Announcement Card */}
        <section
          id="welcome-announcement-card"
          className="bg-white rounded-2xl p-6 md:p-8 shadow-xl border-2 border-amber-200 mb-10 text-center relative overflow-hidden"
        >
          <div className="text-3xl mb-3 flex items-center justify-center gap-2">
            <span>🍋</span>
            <span>🍷</span>
            <span>🍕</span>
          </div>

          <div className="flex items-center justify-center gap-2 mb-1.5">
            <span className="h-px w-6 bg-amber-300"></span>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-700">
              25 Juillet 2026
            </p>
            <span className="h-px w-6 bg-amber-300"></span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif-title font-bold text-slate-900 tracking-tight mb-1">
            Katia & Jean-François
          </h1>

          <h2 className="text-base sm:text-lg font-medium text-amber-900 italic mb-4 flex items-center justify-center gap-1.5">
            <span>Contribue à nos souvenirs de mariage</span>
            <Heart className="w-4 h-4 text-amber-600 fill-amber-500 inline-block" />
          </h2>

          <p className="text-base md:text-lg leading-relaxed text-slate-800 font-medium max-w-2xl mx-auto mb-6">
            Chère famille et amis, le mariage est déjà fini mais nous souhaiterions qu'il dure toujours... laissez nous un petit mot doux, une anecdote du mariage (on n'a pas pu être partout et nous sommes friands de potins!), ou un souhait pour nos années à venir.
          </p>

          {/* Authentic Wedding Group Photo */}
          <div className="mt-4 max-w-xl mx-auto">
            <div
              onClick={() =>
                handleOpenPhoto(
                  [
                    {
                      id: 'wedding-group-main',
                      url: '/wedding_group_thank_you.jpg',
                      name: 'Katia & Jean-François entourés de tous les invités du mariage'
                    }
                  ],
                  0
                )
              }
              className="group relative rounded-2xl overflow-hidden shadow-lg border-2 border-amber-300 cursor-pointer bg-slate-900 transition transform hover:scale-[1.01] active:scale-[0.99]"
              title="Cliquer pour voir la photo en grand écran"
            >
              <img
                src="/wedding_group_thank_you.jpg"
                alt="Photo souvenir avec Katia & Jean-François et tous les invités du mariage"
                className="w-full aspect-3/2 object-cover object-center group-hover:opacity-95 transition"
                loading="eager"
              />
            </div>
          </div>
        </section>

        {/* Guestbook Form with inspiration prompts, photo attachments & automatic email forwarding */}
        <GuestbookForm onSubmitEntry={handleAddEntry} />

        {/* Guestbook Memories List */}
        <GuestbookList
          entries={entries}
          isPinUnlocked={isPinUnlocked}
          onRequestUnlockPin={() => setIsPinModalOpen(true)}
          onLockPin={handleLockPin}
          onOpenPhoto={handleOpenPhoto}
          onAddReaction={handleAddReaction}
          onExportSouvenirs={handleExportSouvenirs}
        />
      </main>

      {/* Footer */}
      <footer className="mt-16 text-center text-xs text-amber-900/70 border-t border-amber-200/60 pt-6 pb-6">
        <p className="flex items-center justify-center gap-1.5 font-medium">
          <span>Mariage de Katia & Jean-François</span>
          <span>•</span>
          <span>25 Juillet 2026</span>
          <span>•</span>
          <Heart className="w-3.5 h-3.5 fill-amber-600 text-amber-600" />
        </p>
        <p className="text-[11px] text-slate-400 mt-1">
          Transmis sur <strong className="text-slate-600">k.jf.mariage@gmail.com</strong>
        </p>
      </footer>

      {/* Photo Lightbox Modal */}
      {activeLightbox && (
        <PhotoLightbox
          photos={activeLightbox.photos}
          currentIndex={activeLightbox.index}
          onClose={() => setActiveLightbox(null)}
          onNavigate={(newIndex) =>
            setActiveLightbox((prev) => (prev ? { ...prev, index: newIndex } : null))
          }
        />
      )}

      {/* PIN Unlock Modal */}
      <PinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handleUnlockPinSuccess}
      />
    </div>
  );
}
