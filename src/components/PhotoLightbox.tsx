import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { PhotoAttachment } from '../types';

interface PhotoLightboxProps {
  photos: PhotoAttachment[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
  photos,
  currentIndex,
  onClose,
  onNavigate
}) => {
  const currentPhoto = photos[currentIndex];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && currentIndex > 0) onNavigate(currentIndex - 1);
      if (e.key === 'ArrowRight' && currentIndex < photos.length - 1) onNavigate(currentIndex + 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, photos.length, onClose, onNavigate]);

  if (!currentPhoto) return null;

  return (
    <div
      id="photo-lightbox-modal"
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 select-none"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Controls bar */}
        <div className="w-full flex items-center justify-between text-white pb-3 px-2">
          <span className="text-sm font-medium text-slate-300">
            {currentIndex + 1} / {photos.length}
          </span>

          <div className="flex items-center gap-2">
            <a
              href={currentPhoto.url}
              download={currentPhoto.name || 'souvenir-mariage.jpg'}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
              title="Télécharger l'image"
            >
              <Download className="w-5 h-5" />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main image */}
        <div className="relative flex items-center justify-center overflow-hidden rounded-xl border border-white/20 shadow-2xl bg-black">
          <img
            src={currentPhoto.url}
            alt={currentPhoto.name || 'Souvenir'}
            className="max-h-[75vh] max-w-full object-contain rounded-xl"
          />

          {/* Navigation arrows */}
          {photos.length > 1 && (
            <>
              {currentIndex > 0 && (
                <button
                  type="button"
                  onClick={() => onNavigate(currentIndex - 1)}
                  className="absolute left-3 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition border border-white/20 shadow-md"
                  aria-label="Image précédente"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              {currentIndex < photos.length - 1 && (
                <button
                  type="button"
                  onClick={() => onNavigate(currentIndex + 1)}
                  className="absolute right-3 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition border border-white/20 shadow-md"
                  aria-label="Image suivante"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
