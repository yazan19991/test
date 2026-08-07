import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { RoomState } from '../types';
import { sounds } from '../lib/audio';
import { t, Language } from '../data/translations';

interface SpyGuessingProps {
  room: RoomState;
  currentPlayerId: string | null;
  onSpyGuess: (guessedWord: string) => void;
}

export const SpyGuessing: React.FC<SpyGuessingProps> = ({ room, currentPlayerId, onSpyGuess }) => {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  const lang: Language = room.language || 'ar';
  const isRtl = lang === 'ar';

  const isSpy = room.isSpy;
  const accusedPlayer = room.accusedPlayer;

  const handleGuessSubmit = (word: string) => {
    setSelectedWord(word);
    sounds.ready();
    onSpyGuess(word);
  };

  // If Current Player IS the Spy -> Show 4 Choice Buttons!
  if (isSpy) {
    return (
      <div className={`w-full max-w-lg mx-auto p-4 sm:p-6 space-y-6 ${isRtl ? 'dir-rtl' : 'dir-ltr'}`}>
        
        {/* Banner */}
        <div className="bg-[#16162d]/95 border border-rose-600/80 rounded-3xl p-6 text-center shadow-2xl space-y-2 relative overflow-hidden backdrop-blur-md">
          <div className="inline-flex p-3 bg-rose-950/80 border border-rose-700 rounded-2xl text-4xl mb-1 shadow-[0_0_20px_rgba(225,29,72,0.4)]">
            🕵️‍♂️
          </div>
          <span className="text-xs font-bold bg-rose-950 text-rose-300 border border-rose-800 px-3 py-1 rounded-full uppercase">
            {t('lastChanceTitle', lang)}
          </span>
          <h2 className="text-2xl font-black text-rose-100">{t('exposedAsSpyTitle', lang)}</h2>
          <p className="text-xs text-rose-200/80 max-w-xs mx-auto">
            {t('exposedAsSpyDesc', lang)}
          </p>
        </div>

        {/* 4 Choices Buttons */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-[#8888b0] px-1">{t('chooseSecretWordLabel', lang)}</label>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {room.spyGuessChoices?.map((word, idx) => (
              <button
                key={idx}
                disabled={selectedWord !== null}
                onClick={() => handleGuessSubmit(word)}
                className={`p-4 rounded-2xl border text-center font-bold text-base transition-all cursor-pointer shadow-lg active:scale-95 ${
                  selectedWord === word
                    ? 'bg-[#ff5f1f] border-[#ff5f1f] text-white font-black shadow-[0_0_20px_rgba(255,95,31,0.5)]'
                    : 'bg-white/5 hover:bg-[#ff5f1f]/20 border-white/10 hover:border-[#ff5f1f] text-[#e0e0f0]'
                }`}
              >
                {word}
              </button>
            ))}
          </div>
        </div>

      </div>
    );
  }

  // If Current Player is NOT the Spy -> Suspense Waiting Screen!
  return (
    <div className={`w-full max-w-lg mx-auto p-4 sm:p-6 space-y-6 ${isRtl ? 'dir-rtl' : 'dir-ltr'}`}>
      
      <div className="bg-[#16162d]/95 border border-white/10 rounded-3xl p-8 text-center shadow-2xl space-y-5 backdrop-blur-md">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-[#ff5f1f]/20 border border-[#ff5f1f]/50 flex items-center justify-center text-4xl shadow-[0_0_25px_rgba(255,95,31,0.4)] animate-pulse">
          🔍
        </div>

        <div>
          <span className="text-xs font-bold text-[#00ff88] bg-[#00ff88]/10 border border-[#00ff88]/30 px-3 py-1 rounded-full">
            {t('spyExposedSuccessBadge', lang)}
          </span>
          <h2 className="text-2xl font-black text-[#e0e0f0] mt-3">
            {t('spyGuessingTitle', lang)}
          </h2>
          <p className="text-sm font-bold text-[#ff5f1f] mt-1">
            {t('spyGuessingDesc', lang, { name: accusedPlayer ? accusedPlayer.name : (lang === 'en' ? 'The Spy' : 'الجاسوس') })}
          </p>
        </div>

        <div className="p-4 bg-black/40 border border-white/5 rounded-2xl text-xs text-[#8888b0] leading-relaxed max-w-xs mx-auto">
          {t('spyGuessExplanation', lang)}
        </div>

        <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#ff5f1f] animate-bounce pt-2">
          <Sparkles className="w-4 h-4" />
          <span>{t('waitingForSpyGuess', lang)}</span>
        </div>
      </div>

    </div>
  );
};
