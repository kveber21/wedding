import React, { useState } from 'react';
import { Search, Image, MessageSquare, Download, Printer, Lock, Unlock, KeyRound, Archive, Loader2 } from 'lucide-react';
import { GuestbookEntry, PhotoAttachment } from '../types';
import { GuestbookCard } from './GuestbookCard';
import { downloadAllPhotosZip } from '../utils/zipExport';

interface GuestbookListProps {
  entries: GuestbookEntry[];
  isPinUnlocked: boolean;
  canDelete?: boolean;
  onDelete?: (id: string | number) => void;
  onRequestUnlockPin: () => void;
  onLockPin: () => void;
  onOpenPhoto: (photos: PhotoAttachment[], index: number) => void;
  onAddReaction: (id: string | number, reactionType: 'heart' | 'toast' | 'lemon' | 'sparkle') => void;
  onExportSouvenirs: () => void;
}

export const GuestbookList: React.FC<GuestbookListProps> = ({
  entries,
  isPinUnlocked,
  canDelete = false,
  onDelete,
  onRequestUnlockPin,
  onLockPin,
  onOpenPhoto,
  onAddReaction,
  onExportSouvenirs
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyWithPhotos, setOnlyWithPhotos] = useState(false);
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private'>('all');
  const [isZipping, setIsZipping] = useState(false);
  const [zipSuccessMessage, setZipSuccessMessage] = useState<string | null>(null);

  const totalPhotos = entries.reduce((acc, curr) => acc + (curr.photos?.length || 0), 0);

  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      const result = await downloadAllPhotosZip(entries);
      setZipSuccessMessage(`Archive ZIP téléchargée (${result.count} photo${result.count > 1 ? 's' : ''}) !`);
      setTimeout(() => setZipSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Error downloading photos ZIP:', err);
    } finally {
      setIsZipping(false);
    }
  };

  const filteredEntries = entries.filter((entry) => {
    // If an entry is private and the PIN is not unlocked, do not match its author or message in search
    const isSecretLocked = entry.isPrivate && !isPinUnlocked;
    const authorText = isSecretLocked ? '' : entry.author.toLowerCase();
    const messageText = isSecretLocked ? '' : entry.message.toLowerCase();

    const matchesSearch =
      !searchTerm ||
      authorText.includes(searchTerm.toLowerCase()) ||
      messageText.includes(searchTerm.toLowerCase());

    const matchesPhotos = !onlyWithPhotos || (entry.photos && entry.photos.length > 0);

    const matchesVisibility =
      visibilityFilter === 'all' ||
      (visibilityFilter === 'private' ? !!entry.isPrivate : !entry.isPrivate);

    return matchesSearch && matchesPhotos && matchesVisibility;
  });

  const hasPrivateMessages = entries.some(e => e.isPrivate);

  const handlePrint = () => {
    window.print();
  };

  return (
    <section id="guestbook-list-section" className="space-y-5 sm:space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1">
        <h3 className="text-xl sm:text-2xl font-serif-title font-bold text-slate-900 flex items-center gap-2">
          <span>📖</span>
          <span>Le Livre des Souvenirs</span>
          <span className="text-xs sm:text-sm font-sans font-semibold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full">
            {entries.length}
          </span>
        </h3>

        {/* Action buttons (ZIP photos, Print, Backup) */}
        {entries.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
            {totalPhotos > 0 && (
              <button
                type="button"
                onClick={handleDownloadZip}
                disabled={isZipping}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-amber-950 bg-amber-300 hover:bg-amber-400 border border-amber-400 rounded-xl shadow-2xs transition min-h-[38px] touch-manipulation cursor-pointer disabled:opacity-50"
                title="Télécharger toutes les photos des invités en un clic (archive ZIP)"
              >
                {isZipping ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-900" />
                ) : (
                  <Archive className="w-3.5 h-3.5 text-amber-900" />
                )}
                <span>{isZipping ? 'Création ZIP...' : `Photos (${totalPhotos}) ZIP`}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition min-h-[38px] touch-manipulation"
              title="Imprimer ou enregistrer en PDF"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Imprimer</span>
            </button>

            <button
              type="button"
              onClick={onExportSouvenirs}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition min-h-[38px] touch-manipulation"
              title="Télécharger une sauvegarde du livre d'or"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Sauvegarder</span>
            </button>
          </div>
        )}
      </div>

      {zipSuccessMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-bold flex items-center gap-2">
          <span>✅</span>
          <span>{zipSuccessMessage}</span>
        </div>
      )}

      {/* Search & Filter Toolbar for guests - clean and unobtrusive */}
      {entries.length > 2 && (
        <div className="bg-white/90 backdrop-blur-sm p-3 sm:p-3.5 rounded-xl border border-amber-200 shadow-xs flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative w-full flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par nom d'invité ou mot-clé..."
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 focus:border-amber-400 focus:ring-1 focus:ring-amber-300 outline-none min-h-[38px]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                Effacer
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setOnlyWithPhotos(!onlyWithPhotos)}
            className={`text-xs font-semibold px-3 py-2 rounded-lg border flex items-center gap-1.5 transition min-h-[38px] touch-manipulation whitespace-nowrap cursor-pointer shrink-0 ${
              onlyWithPhotos
                ? 'bg-amber-200 border-amber-400 text-amber-950 shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-amber-50'
            }`}
          >
            <Image className="w-3.5 h-3.5 text-amber-700" />
            <span>Photos uniquement</span>
          </button>
        </div>
      )}

      {/* Entries List */}
      <div id="messagesList" className="space-y-5 sm:space-y-6">
        {filteredEntries.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 sm:p-10 text-center border-2 border-dashed border-amber-200 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800 text-base mb-1">
              {searchTerm || onlyWithPhotos || visibilityFilter !== 'all' ? 'Aucun souvenir trouvé' : 'Soyez le premier à laisser un souvenir !'}
            </h4>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              {searchTerm || onlyWithPhotos || visibilityFilter !== 'all'
                ? 'Essayez de modifier vos filtres de recherche.'
                : 'Partagez un vœu chaleureux ou une petite anecdote pour Katia & Jean-François ci-dessus.'}
            </p>
          </div>
        ) : (
          filteredEntries.map((entry, index) => {
            const entryKey = entry.id !== undefined && entry.id !== null && entry.id !== ''
              ? `entry-${entry.id}`
              : `entry-idx-${index}-${entry.timestamp || index}`;
            return (
              <GuestbookCard
                key={entryKey}
                entry={entry}
                isPinUnlocked={isPinUnlocked}
                canDelete={canDelete}
                onDelete={onDelete}
                onRequestUnlockPin={onRequestUnlockPin}
                onOpenPhoto={onOpenPhoto}
                onAddReaction={onAddReaction}
              />
            );
          })
        )}
      </div>

      {/* PIN Security Banner / Controls - Placé discrètement tout en bas pour ne pas gêner les invités */}
      <div className="mt-8 pt-4 border-t border-amber-200/80">
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-3.5 bg-amber-50/80 rounded-xl border border-amber-200 text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-950 flex items-center gap-1.5">
              {isPinUnlocked ? (
                <Unlock className="w-4 h-4 text-emerald-600" />
              ) : (
                <Lock className="w-4 h-4 text-amber-700" />
              )}
              <span>Espace Mariés :</span>
            </span>
            <span className="text-slate-600">
              {isPinUnlocked
                ? 'Accès déverrouillé (messages privés visibles)'
                : 'Messages confidentiels réservés aux mariés'}
            </span>
          </div>

          {isPinUnlocked ? (
            <button
              type="button"
              onClick={onLockPin}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition active:scale-95 touch-manipulation cursor-pointer"
            >
              Reverrouiller
            </button>
          ) : (
            <button
              type="button"
              onClick={onRequestUnlockPin}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-500 text-amber-950 text-xs font-bold transition shadow-2xs active:scale-95 touch-manipulation cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-900" />
              <span>Accès Mariés (code PIN)</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

