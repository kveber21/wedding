import React, { useState } from 'react';
import { Lock, Unlock, X, AlertCircle, Check } from 'lucide-react';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentPin?: string;
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentPin = '2507'
}) => {
  const [enteredPin, setEnteredPin] = useState('');
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (enteredPin.length < 4) {
      const next = enteredPin + digit;
      setEnteredPin(next);
      setError(false);

      if (next.length === 4) {
        verifyPin(next);
      }
    }
  };

  const handleDelete = () => {
    setEnteredPin(prev => prev.slice(0, -1));
    setError(false);
  };

  const verifyPin = (pinToTest: string) => {
    if (pinToTest === currentPin) {
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        setSuccess(false);
        setEnteredPin('');
        onClose();
      }, 500);
    } else {
      setError(true);
      setTimeout(() => {
        setEnteredPin('');
      }, 700);
    }
  };

  return (
    <div
      id="pin-modal-backdrop"
      className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="pin-modal-content"
        className="bg-white rounded-2xl shadow-2xl border-2 border-amber-300 max-w-sm w-full p-6 text-center relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
          title="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-3 border border-amber-200">
          {success ? <Unlock className="w-6 h-6 text-emerald-600" /> : <Lock className="w-6 h-6 text-amber-700" />}
        </div>

        <h3 className="text-xl font-serif-title font-bold text-slate-900 mb-1">
          Espace Mariés
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 mb-5">
          Entrez le code PIN secret pour afficher les messages intimes réservés aux mariés.
        </p>

        {/* PIN Dots display */}
        <div className="flex justify-center items-center gap-3 mb-5">
          {[0, 1, 2, 3].map((index) => {
            const hasDigit = enteredPin.length > index;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  hasDigit
                    ? success
                      ? 'bg-emerald-500 scale-110'
                      : error
                      ? 'bg-rose-500 scale-110'
                      : 'bg-amber-500 scale-110'
                    : 'bg-slate-200 border border-slate-300'
                }`}
              />
            );
          })}
        </div>

        {error && (
          <p className="text-xs font-bold text-rose-600 mb-4 flex items-center justify-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Code PIN incorrect. Réessayez.</span>
          </p>
        )}

        {success && (
          <p className="text-xs font-bold text-emerald-600 mb-4 flex items-center justify-center gap-1">
            <Check className="w-3.5 h-3.5" />
            <span>Accès déverrouillé !</span>
          </p>
        )}

        {/* Smartphone-friendly Keypad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[240px] mx-auto mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-12 rounded-xl bg-slate-50 hover:bg-amber-100 text-slate-800 hover:text-amber-950 font-bold text-lg border border-slate-200 active:scale-95 transition shadow-2xs"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setEnteredPin('')}
            className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs border border-slate-200 active:scale-95 transition"
          >
            C
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-12 rounded-xl bg-slate-50 hover:bg-amber-100 text-slate-800 hover:text-amber-950 font-bold text-lg border border-slate-200 active:scale-95 transition shadow-2xs"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs border border-slate-200 active:scale-95 transition"
          >
            ⌫
          </button>
        </div>
      </div>
    </div>
  );
};
