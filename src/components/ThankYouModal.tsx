import React from 'react';
import { X, Heart, Sparkles, CheckCircle2, BookOpen } from 'lucide-react';

interface ThankYouModalProps {
  isOpen: boolean;
  onClose: () => void;
  authorName?: string;
  isPrivate?: boolean;
  onViewGuestbook?: () => void;
}

export const ThankYouModal: React.FC<ThankYouModalProps> = ({
  isOpen,
  onClose,
  authorName,
  isPrivate = false,
  onViewGuestbook,
}) => {
  if (!isOpen) return null;

  const handleScrollToGuestbook = () => {
    onClose();
    if (onViewGuestbook) {
      onViewGuestbook();
    } else {
      const element = document.getElementById('guestbook-list-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div
      id="thank-you-modal-backdrop"
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        id="thank-you-modal-card"
        className="bg-white w-full max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-amber-300 overflow-hidden relative my-auto animate-scaleUp"
      >
        {/* Close button */}
        <button
          type="button"
          id="thank-you-modal-close-btn"
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 flex items-center justify-center shadow-md transition touch-manipulation cursor-pointer"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Wedding Group Photo */}
        <div className="relative w-full aspect-3/2 bg-slate-900 overflow-hidden">
          <img
            src="/wedding_group_thank_you.jpg"
            alt="Katia & Jean-François avec tous les invités du mariage"
            className="w-full h-full object-cover object-center"
            referrerPolicy="no-referrer"
            loading="eager"
          />
        </div>

        {/* Content */}
        <div className="p-5 sm:p-7 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mb-3">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <h3 className="text-2xl sm:text-3xl font-serif-title font-bold text-slate-900 tracking-tight mb-2">
            Merci pour ta contribution !
          </h3>

          {authorName && (
            <p className="text-amber-800 font-semibold text-sm sm:text-base mb-2">
              Merci beaucoup, {authorName} !
            </p>
          )}

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6 max-w-md mx-auto">
            {isPrivate
              ? "Ton mot doux a bien été transmis en privé à Katia & Jean-François."
              : "Ton message et tes souvenirs ont bien été ajoutés au livre d'or. Ils resteront gravés pour toujours !"}
          </p>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
            {!isPrivate && (
              <button
                type="button"
                id="thank-you-view-guestbook-btn"
                onClick={handleScrollToGuestbook}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold text-sm sm:text-base shadow-md transition touch-manipulation cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Voir le livre d'or</span>
              </button>
            )}

            <button
              type="button"
              id="thank-you-close-btn"
              onClick={onClose}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm sm:text-base transition touch-manipulation cursor-pointer"
            >
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
              <span>Fermer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
