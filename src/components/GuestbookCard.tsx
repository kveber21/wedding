import React, { useState } from 'react';
import { Heart, Wine, Sparkles, Calendar, Clock, User, Lock, Unlock, KeyRound, Trash2 } from 'lucide-react';
import { GuestbookEntry, PhotoAttachment } from '../types';

interface GuestbookCardProps {
  entry: GuestbookEntry;
  isPinUnlocked?: boolean;
  canDelete?: boolean;
  onDelete?: (id: string | number) => void;
  onRequestUnlockPin?: () => void;
  onOpenPhoto: (photos: PhotoAttachment[], index: number) => void;
  onAddReaction: (id: string | number, reactionType: 'heart' | 'toast' | 'lemon' | 'sparkle') => void;
}

export const GuestbookCard: React.FC<GuestbookCardProps> = ({
  entry,
  isPinUnlocked = false,
  canDelete = false,
  onDelete,
  onRequestUnlockPin,
  onOpenPhoto,
  onAddReaction
}) => {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const reactions = entry.reactions || {};

  // Check if message starts with an inspiration question
  const parts = entry.message.split('\n\n');
  const hasQuestionHeader = parts.length > 1 && (parts[0].endsWith('?') || parts[0].endsWith('!'));
  const questionPart = hasQuestionHeader ? parts[0] : null;
  const messageBody = hasQuestionHeader ? parts.slice(1).join('\n\n') : entry.message;

  const isLocked = entry.isPrivate && !isPinUnlocked;

  // Extract date and time, deriving hour/minute from timestamp if older entry has date only
  const getDateTimeDisplay = () => {
    let datePart = entry.date;
    let timePart = '';

    if (entry.date && entry.date.includes(' à ')) {
      const splitParts = entry.date.split(' à ');
      datePart = splitParts[0];
      timePart = splitParts[1];
    } else if (entry.timestamp && !isNaN(entry.timestamp)) {
      const d = new Date(entry.timestamp);
      timePart = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      if (!datePart) {
        datePart = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
      }
    }

    return { datePart, timePart };
  };

  const { datePart, timePart } = getDateTimeDisplay();

  return (
    <article
      id={`entry-card-${entry.id}`}
      className={`bg-white rounded-2xl p-5 sm:p-6 md:p-7 shadow-md hover:shadow-lg transition border relative overflow-hidden ${
        entry.isPrivate ? 'border-amber-400/80 bg-amber-50/20' : 'border-amber-200/90'
      }`}
    >
      {/* Private indicator banner if message is private */}
      {entry.isPrivate && (
        <div className="mb-3 px-3 py-1.5 rounded-lg bg-amber-100 border border-amber-300 text-amber-950 text-xs font-semibold flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            {isPinUnlocked ? (
              <>
                <Unlock className="w-3.5 h-3.5 text-emerald-700" />
                <span className="text-emerald-900 font-bold">Réservé uniquement aux mariés (Déverrouillé)</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-amber-800" />
                <span>Réservé uniquement aux mariés</span>
              </>
            )}
          </span>
          <span className="text-[10px] uppercase font-bold text-amber-800">Privé</span>
        </div>
      )}

      {/* Top row: author + date & time */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4 pb-3 border-b border-amber-100">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-base border border-amber-200 shrink-0">
            {entry.author.charAt(0).toUpperCase() || <User className="w-5 h-5" />}
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-base sm:text-lg leading-tight flex items-center gap-1.5">
              <span>{entry.author}</span>
              {entry.isPrivate && <Lock className="w-3.5 h-3.5 text-amber-700 inline" />}
            </h4>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-amber-800/80 font-medium mt-0.5">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span>{datePart}</span>
              </span>
              {timePart && (
                <>
                  <span className="text-amber-400">•</span>
                  <span className="flex items-center gap-1 text-amber-900/90 font-medium">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>{timePart}</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right side: Lemon stamp + Admin delete button if unlocked */}
        <div className="flex items-center gap-2">
          {canDelete && (
            <div>
              {isConfirmingDelete ? (
                <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-2 py-1 rounded-lg text-xs animate-in fade-in">
                  <span className="text-rose-800 font-medium text-[11px]">Supprimer ?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsConfirmingDelete(false);
                      onDelete?.(entry.id);
                    }}
                    className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold transition text-[11px]"
                  >
                    Oui
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(false)}
                    className="px-1.5 py-0.5 text-slate-600 hover:text-slate-900 rounded text-[11px]"
                  >
                    Non
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(true)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title="Supprimer ce message (Admin)"
                  aria-label="Supprimer ce message"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
          <span className="text-xl select-none" title="Souvenir de mariage">🍋</span>
        </div>
      </div>

      {/* Message content (or locked view) */}
      {isLocked ? (
        <div className="my-2 p-5 bg-amber-50/90 rounded-xl border border-amber-300 text-center space-y-2.5 shadow-2xs">
          <div className="w-10 h-10 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center mx-auto">
            <Lock className="w-5 h-5" />
          </div>
          <p className="text-sm font-bold text-slate-900">
            Message intime réservé uniquement aux mariés
          </p>
          <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
            Ce souvenir a été confié en privé. Katia & Jean-François peuvent le déverrouiller grâce à leur code PIN.
          </p>
          {onRequestUnlockPin && (
            <button
              type="button"
              onClick={onRequestUnlockPin}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer touch-manipulation min-h-[38px]"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Déverrouiller avec le code PIN</span>
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="text-slate-800 space-y-2">
            {questionPart && (
              <div className="bg-amber-50/80 border-l-3 border-amber-400 px-3.5 py-2 rounded-r-xl text-amber-950 text-sm font-semibold italic">
                « {questionPart} »
              </div>
            )}

            <p className="whitespace-pre-line leading-relaxed text-sm sm:text-base text-slate-700 font-normal">
              {messageBody}
            </p>
          </div>

          {/* Attached photos */}
          {entry.photos && entry.photos.length > 0 && (
            <div className="mt-5 pt-3 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                Photos partagées ({entry.photos.length})
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {entry.photos.map((photo, pIdx) => (
                  <button
                    key={photo.id || pIdx}
                    type="button"
                    onClick={() => onOpenPhoto(entry.photos!, pIdx)}
                    className="group relative aspect-4/3 rounded-xl overflow-hidden border border-amber-200/80 bg-slate-100 shadow-2xs hover:opacity-95 transition cursor-pointer min-h-[44px]"
                  >
                    <img
                      src={photo.url}
                      alt={photo.name || 'Souvenir'}
                      className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-semibold">
                      Agrandir 🔍
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Interactive Reactions */}
      <div className="mt-5 pt-3 border-t border-amber-50 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => onAddReaction(entry.id, 'heart')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-800 transition active:scale-95 min-h-[36px] touch-manipulation"
            title="Envoyer de l'amour"
          >
            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
            <span>{reactions.heart || 0}</span>
          </button>

          <button
            type="button"
            onClick={() => onAddReaction(entry.id, 'toast')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-amber-900 transition active:scale-95 min-h-[36px] touch-manipulation"
            title="Porter un toast"
          >
            <Wine className="w-3.5 h-3.5 text-amber-700" />
            <span>{reactions.toast || 0}</span>
          </button>

          <button
            type="button"
            onClick={() => onAddReaction(entry.id, 'lemon')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-amber-300 bg-amber-100/70 hover:bg-amber-200/70 text-amber-950 transition active:scale-95 min-h-[36px] touch-manipulation"
            title="Clin d'œil citronné"
          >
            <span>🍋</span>
            <span>{reactions.lemon || 0}</span>
          </button>

          <button
            type="button"
            onClick={() => onAddReaction(entry.id, 'sparkle')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-sky-200 bg-sky-50/70 hover:bg-sky-100 text-sky-900 transition active:scale-95 min-h-[36px] touch-manipulation"
            title="Magique !"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            <span>{reactions.sparkle || 0}</span>
          </button>
        </div>

        <span className="text-[11px] text-slate-400 italic">
          Mariage Katia & JF
        </span>
      </div>
    </article>
  );
};
