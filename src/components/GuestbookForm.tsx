import React, { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { ImagePlus, X, Sparkles, HelpCircle, CheckCircle2, Loader2, Eye, EyeOff, Lock, Globe, Mail, Heart } from 'lucide-react';
import { INITIAL_QUESTIONS } from '../utils/storage';
import { compressImage } from '../utils/imageCompressor';
import { PhotoAttachment } from '../types';
import { sendEntryByEmail, createMailtoLink } from '../utils/mailSender';
import { ThankYouModal } from './ThankYouModal';

interface GuestbookFormProps {
  onSubmitEntry: (author: string, message: string, photos: PhotoAttachment[], isPrivate: boolean) => void;
}

export const GuestbookForm: React.FC<GuestbookFormProps> = ({ onSubmitEntry }) => {
  const [author, setAuthor] = useState('');
  const [message, setMessage] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [photos, setPhotos] = useState<PhotoAttachment[]>([]);
  const [isProcessingPhotos, setIsProcessingPhotos] = useState(false);
  const [isThankYouModalOpen, setIsThankYouModalOpen] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<null | {
    author: string;
    isPrivate: boolean;
    mailto: string;
  }>(null);
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);

  const messageTextareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectQuestion = (q: string) => {
    setActiveQuestion(q);
    if (!message.trim()) {
      setMessage(`${q}\n\n`);
    } else if (!message.includes(q)) {
      setMessage(`${q}\n\n${message}`);
    }
    setTimeout(() => {
      if (messageTextareaRef.current) {
        messageTextareaRef.current.focus();
        messageTextareaRef.current.setSelectionRange(
          messageTextareaRef.current.value.length,
          messageTextareaRef.current.value.length
        );
      }
    }, 50);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingPhotos(true);
    const newPhotos: PhotoAttachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      try {
        // Maintain high quality resolution for display and ZIP export
        const compressedBase64 = await compressImage(file, 2000, 0.88);
        newPhotos.push({
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          url: compressedBase64,
          name: file.name,
          size: file.size
        });
      } catch (err) {
        console.error("Failed to process image:", err);
      }
    }

    setPhotos((prev) => [...prev, ...newPhotos]);
    setIsProcessingPhotos(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAuthor = author.trim();
    const cleanMessage = message.trim();

    if (!cleanAuthor || !cleanMessage) return;

    onSubmitEntry(cleanAuthor, cleanMessage, photos, isPrivate);

    const now = new Date();
    const dateFormatted = now.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const timeFormatted = now.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const formattedDate = `${dateFormatted} à ${timeFormatted}`;

    const mailto = createMailtoLink({
      author: cleanAuthor,
      message: cleanMessage,
      isPrivate
    });

    // Send copy to k.jf.mariage@gmail.com
    sendEntryByEmail({
      author: cleanAuthor,
      message: cleanMessage,
      date: formattedDate,
      isPrivate,
      photos
    });

    // Trigger celebratory wedding confetti
    try {
      confetti({
        particleCount: 110,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#FBBF24', '#0284C7', '#38BDF8', '#F43F5E', '#10B981']
      });
    } catch (err) {
      console.log('Confetti error:', err);
    }

    const wasPrivate = isPrivate;
    const authorForSuccess = cleanAuthor;
    setAuthor('');
    setMessage('');
    setPhotos([]);
    setActiveQuestion(null);
    setIsPrivate(false);
    setSubmittedSuccess({
      author: authorForSuccess,
      isPrivate: wasPrivate,
      mailto
    });
    setIsThankYouModalOpen(true);
  };

  return (
    <section id="guestbook-form-section" className="bg-white rounded-2xl shadow-xl border-2 border-amber-300 p-5 sm:p-6 md:p-8 mb-10">
      <h3 className="text-xl md:text-2xl font-serif-title font-bold text-slate-900 mb-5 flex items-center gap-2">
        <span className="text-2xl">✍️</span>
        <span>Laisser un message aux mariés</span>
      </h3>

      {/* Question prompts / inspiration section */}
      <div className="mb-6">
        <label className="block text-sm font-bold text-slate-800 mb-2 flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Besoin d'inspiration ? Choisissez une question pour commencer :</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" id="questionsContainer">
          {INITIAL_QUESTIONS.map((q, idx) => {
            const isSelected = activeQuestion === q;
            return (
              <button
                key={idx}
                type="button"
                id={`question-chip-${idx}`}
                onClick={() => handleSelectQuestion(q)}
                className={`text-left text-xs sm:text-sm p-3 rounded-xl transition font-medium border flex items-start gap-2 active:scale-[0.98] min-h-[44px] ${
                  isSelected
                    ? 'bg-amber-200 border-amber-400 text-amber-950 font-semibold shadow-xs'
                    : 'bg-amber-50 hover:bg-amber-100/80 border-amber-200 text-amber-950'
                }`}
              >
                <span className="leading-snug">{q}</span>
              </button>
            );
          })}
        </div>
      </div>

      {submittedSuccess && (
        <div className="mb-6 p-4 sm:p-5 bg-amber-50/90 border-2 border-amber-300 rounded-2xl text-slate-900 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={() => setIsThankYouModalOpen(true)}
              className="group relative shrink-0 w-20 h-16 sm:w-24 sm:h-18 rounded-xl overflow-hidden border-2 border-amber-400 shadow-sm cursor-pointer transition transform hover:scale-105"
              title="Cliquer pour voir la photo en grand"
            >
              <img
                src="/wedding_group_thank_you.jpg"
                alt="Katia & Jean-François avec tous les invités"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <span className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition flex items-center justify-center text-white text-[10px] font-bold">
                🔍 Agrandir
              </span>
            </button>
            <div>
              <p className="font-serif-title font-bold text-lg sm:text-xl text-slate-900 flex items-center gap-2">
                <span>Merci pour votre contribution !</span>
                <span>💛</span>
              </p>
              <p className="text-xs sm:text-sm text-slate-700 mt-0.5 mb-1.5">
                {submittedSuccess.isPrivate
                  ? '🔒 Votre message a bien été envoyé en privé pour Katia & Jean-François.'
                  : "✨ Votre souvenir a été publié avec succès dans le livre d'or partagé !"}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsThankYouModalOpen(true)}
                  className="font-bold text-amber-900 hover:text-amber-950 underline cursor-pointer"
                >
                  Voir la photo de remerciement
                </button>
                <span className="text-amber-400">•</span>
                <span className="text-slate-600 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 inline text-amber-700" />
                  <span>Transmis à <strong>k.jf.mariage@gmail.com</strong></span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
            <a
              href={submittedSuccess.mailto}
              className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition shadow-2xs flex items-center gap-1.5"
              title="Ouvrir dans votre messagerie"
            >
              <Mail className="w-3.5 h-3.5 text-slate-600" />
              <span>Copie e-mail</span>
            </a>
            <button
              type="button"
              onClick={() => setSubmittedSuccess(null)}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-amber-100 transition"
              title="Fermer ce bandeau"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <form id="guestbookForm" onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="author-input" className="block text-sm font-bold text-slate-800 mb-1.5">
            Votre Prénom & Nom <span className="text-amber-600">*</span>
          </label>
          <input
            id="author-input"
            type="text"
            required
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Ex: Oncle Marc & Tante Sophie"
            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-none transition font-medium text-slate-800 bg-white text-base min-h-[46px]"
          />
        </div>

        <div>
          <label htmlFor="message-input" className="block text-sm font-bold text-slate-800 mb-1.5">
            Votre message <span className="text-amber-600">*</span>
          </label>
          <textarea
            id="message-input"
            ref={messageTextareaRef}
            rows={5}
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Écrivez votre mot doux ici..."
            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-none transition font-medium text-slate-800 bg-white leading-relaxed text-base"
          ></textarea>
        </div>

        {/* Photos Upload & Preview */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="photoInput" className="block text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <ImagePlus className="w-4 h-4 text-amber-600" />
              <span>Ajouter des photos (optionnel)</span>
            </label>
            {photos.length > 0 && (
              <span className="text-xs text-amber-800 font-semibold bg-amber-100 px-2.5 py-0.5 rounded-full">
                {photos.length} photo{photos.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <input
              type="file"
              id="photoInput"
              ref={fileInputRef}
              multiple
              accept="image/*"
              onChange={handlePhotoUpload}
              className="block w-full text-sm text-slate-600 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-amber-100 file:text-amber-900 hover:file:bg-amber-200 cursor-pointer border-2 border-dashed border-amber-200 rounded-xl p-2.5 bg-amber-50/40"
            />

            {isProcessingPhotos && (
              <div className="flex items-center gap-2 text-xs font-medium text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                <Loader2 className="w-4 h-4 animate-spin text-amber-600 shrink-0" />
                <span>Optimisation de vos photos pour le livre d'or...</span>
              </div>
            )}

            {/* Photo thumbnails preview */}
            {photos.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 pt-1">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-amber-300 shadow-sm bg-slate-100">
                    <img
                      src={photo.url}
                      alt={photo.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(photo.id)}
                      className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-full transition shadow-md touch-manipulation"
                      title="Retirer cette photo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute inset-x-0 bottom-0 bg-black/60 text-[10px] text-white px-1.5 py-0.5 truncate text-center">
                      {photo.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Option Cacher mon message ou le publier (Visibilité) */}
        <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200/90 space-y-2.5">
          <label className="block text-sm font-bold text-slate-900">
            Visibilité de votre mot doux :
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              id="visibility-public-btn"
              onClick={() => setIsPrivate(false)}
              className={`flex items-center gap-3 p-3 rounded-xl border text-left transition min-h-[52px] touch-manipulation ${
                !isPrivate
                  ? 'bg-amber-100 border-amber-400 text-amber-950 font-bold shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-amber-50/50'
              }`}
            >
              <div className={`p-2 rounded-lg shrink-0 ${!isPrivate ? 'bg-amber-200 text-amber-900' : 'bg-slate-100 text-slate-500'}`}>
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold flex items-center gap-1.5">
                  <span>Publier dans le livre d'or</span>
                  <Eye className="w-3.5 h-3.5 text-amber-700" />
                </p>
                <p className="text-xs text-slate-500 font-normal leading-tight">
                  Visible par tous les invités et les mariés
                </p>
              </div>
            </button>

            <button
              type="button"
              id="visibility-private-btn"
              onClick={() => setIsPrivate(true)}
              className={`flex items-center gap-3 p-3 rounded-xl border text-left transition min-h-[52px] touch-manipulation ${
                isPrivate
                  ? 'bg-amber-100 border-amber-400 text-amber-950 font-bold shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-amber-50/50'
              }`}
            >
              <div className={`p-2 rounded-lg shrink-0 ${isPrivate ? 'bg-amber-200 text-amber-900' : 'bg-slate-100 text-slate-500'}`}>
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold flex items-center gap-1.5">
                  <span>Cacher mon message</span>
                  <EyeOff className="w-3.5 h-3.5 text-amber-700" />
                </p>
                <p className="text-xs text-slate-500 font-normal leading-tight">
                  Réservé uniquement aux mariés
                </p>
              </div>
            </button>
          </div>
        </div>

        <button
          type="submit"
          id="submit-guestbook-btn"
          disabled={isProcessingPhotos}
          className="w-full bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold py-3.5 sm:py-4 rounded-xl shadow-lg hover:shadow-xl transition transform active:scale-[0.98] text-base md:text-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[52px] touch-manipulation"
        >
          <span>🍋</span>
          <span>{isPrivate ? 'Envoyer en privé aux mariés' : 'Publier notre souvenir'}</span>
          <Sparkles className="w-5 h-5 text-amber-800" />
        </button>
      </form>

      {/* Confirmation Modal with the group photo */}
      <ThankYouModal
        isOpen={isThankYouModalOpen}
        onClose={() => setIsThankYouModalOpen(false)}
        authorName={submittedSuccess?.author}
        isPrivate={submittedSuccess?.isPrivate}
      />
    </section>
  );
};
