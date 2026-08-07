import React, { useState } from 'react';
import { Volume2, VolumeX, Copy, Check, Users, HelpCircle } from 'lucide-react';
import { sounds } from '../lib/audio';
import { t, Language } from '../data/translations';

interface HeaderProps {
  roomCode?: string;
  playerCount?: number;
  lang?: Language | string;
  onOpenRules: () => void;
}

export const Header: React.FC<HeaderProps> = ({ roomCode, playerCount, lang = 'ar', onOpenRules }) => {
  const [copied, setCopied] = useState(false);
  const [muted, setMuted] = useState(!sounds.enabled);

  const toggleSound = () => {
    sounds.enabled = !sounds.enabled;
    setMuted(!sounds.enabled);
    if (sounds.enabled) sounds.click();
  };

  const copyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    sounds.click();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="w-full bg-[#16162d]/85 backdrop-blur-md border-b border-white/10 sticky top-0 z-40 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* Logo / Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#ff5f1f] flex items-center justify-center text-xl shadow-[0_0_15px_rgba(255,95,31,0.4)]">
            🕵️‍♂️
          </div>
          <div>
            <h1 className="font-extrabold text-lg sm:text-xl text-[#ff5f1f] tracking-wide leading-tight">
              {t('gameTitle', lang)}
            </h1>
            <p className="text-[10px] sm:text-xs text-[#8888b0]">{t('gameSubtitle', lang)}</p>
          </div>
        </div>

        {/* Room Code Badge & Info */}
        <div className="flex items-center gap-2 sm:gap-3">
          {roomCode && (
            <button
              onClick={copyCode}
              id="header-copy-code-btn"
              className="flex items-center gap-1.5 bg-[#ff5f1f] hover:bg-[#e64a00] border border-[#ff5f1f] px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold text-white transition-all active:scale-95 cursor-pointer shadow-[0_0_15px_rgba(255,95,31,0.4)]"
              title={t('copyCode', lang)}
            >
              <span className="font-mono tracking-wider">{roomCode}</span>
              {copied ? <Check className="w-3.5 h-3.5 text-[#00ff88]" /> : <Copy className="w-3.5 h-3.5 text-white/80" />}
            </button>
          )}

          {playerCount !== undefined && (
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-lg text-xs font-bold text-[#8888b0]">
              <Users className="w-3.5 h-3.5 text-[#ff5f1f]" />
              <span>{playerCount}</span>
            </div>
          )}

          <button
            onClick={onOpenRules}
            id="header-rules-btn"
            className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-[#e0e0f0] transition-colors cursor-pointer"
            title={t('howToPlay', lang)}
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={toggleSound}
            id="header-audio-btn"
            className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-[#e0e0f0] transition-colors cursor-pointer"
            title={muted ? t('playSound', lang) : t('muteSound', lang)}
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-[#00ff88]" />}
          </button>
        </div>
      </div>
    </header>
  );
};
