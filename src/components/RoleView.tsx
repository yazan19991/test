import React, { useState } from 'react';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { RoomState } from '../types';
import { sounds } from '../lib/audio';
import { t, Language } from '../data/translations';

interface RoleViewProps {
  room: RoomState;
  currentPlayerId: string | null;
  onConfirmRole: () => void;
}

export const RoleView: React.FC<RoleViewProps> = ({ room, currentPlayerId, onConfirmRole }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const me = room.players.find(p => p.id === currentPlayerId);
  const hasConfirmed = me?.readyForNext || false;

  const lang: Language = room.language || 'ar';
  const isRtl = lang === 'ar';

  const toggleReveal = () => {
    setIsRevealed(!isRevealed);
    sounds.revealRole();
  };

  const handleConfirm = () => {
    sounds.ready();
    onConfirmRole();
  };

  const confirmedCount = room.players.filter(p => p.readyForNext && p.isOnline).length;
  const totalPlayers = room.players.filter(p => p.isOnline).length;

  return (
    <div className={`w-full max-w-lg mx-auto p-4 sm:p-6 space-y-6 ${isRtl ? 'dir-rtl' : 'dir-ltr'}`}>
      
      {/* Category Banner */}
      <div className="bg-[#16162d]/90 border border-white/10 rounded-2xl p-4 text-center shadow-lg backdrop-blur-md">
        <div className="text-xs font-bold text-[#8888b0]">{t('packSelectedForRound', lang)}</div>
        <div className="text-lg font-black text-[#ff5f1f] mt-0.5">{room.categoryName}</div>
      </div>

      {/* Secret Role Card */}
      <div className="relative">
        <div className={`transition-all duration-500 rounded-3xl p-6 sm:p-8 border shadow-2xl text-center relative overflow-hidden backdrop-blur-md ${
          !isRevealed
            ? 'bg-[#16162d]/95 border-white/10 hover:border-[#ff5f1f]/50'
            : room.isSpy
            ? 'bg-gradient-to-b from-rose-950/90 via-[#16162d] to-[#0b0b1a] border-rose-500/80 shadow-rose-950/50'
            : 'bg-gradient-to-b from-[#00ff88]/10 via-[#16162d] to-[#0b0b1a] border-[#00ff88]/80 shadow-[0_0_30px_rgba(0,255,136,0.2)]'
        }`}>
          
          {!isRevealed ? (
            /* Covered State */
            <div className="py-8 space-y-4">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-[#ff5f1f] border border-[#ff5f1f] flex items-center justify-center text-4xl shadow-[0_0_25px_rgba(255,95,31,0.5)] animate-bounce">
                🔒
              </div>
              <h3 className="text-xl font-bold text-[#e0e0f0]">{t('secretRoleCard', lang)}</h3>
              <p className="text-xs text-[#8888b0] max-w-xs mx-auto">
                {t('secretRoleDesc', lang)}
              </p>
              <button
                onClick={toggleReveal}
                id="reveal-role-btn"
                className="mt-2 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#ff5f1f] to-[#e64a00] hover:brightness-110 text-white font-bold text-sm rounded-xl shadow-[0_10px_30px_rgba(255,95,31,0.4)] transition-all cursor-pointer active:scale-95"
              >
                <Eye className="w-4 h-4" />
                <span>{t('revealRoleBtn', lang)}</span>
              </button>
            </div>
          ) : (
            /* Revealed Role State */
            <div className="py-4 space-y-5 animate-fadeIn">
              {room.isSpy ? (
                /* SPY ROLE */
                <>
                  <div className="inline-flex p-4 bg-rose-950 border border-rose-700 rounded-2xl text-5xl shadow-[0_0_20px_rgba(225,29,72,0.4)]">
                    🕵️‍♂️
                  </div>
                  <div>
                    <span className="text-xs font-bold text-rose-400 bg-rose-950/80 border border-rose-800 px-3 py-1 rounded-full uppercase tracking-wider">
                      {t('youAreSpy', lang)}
                    </span>
                    <h2 className="text-3xl font-black text-rose-200 mt-2">
                      {t('youAreSpy', lang)}
                    </h2>
                  </div>
                  <div className="p-4 bg-black/40 border border-rose-900/60 rounded-xl text-xs text-rose-200/90 leading-relaxed max-w-xs mx-auto">
                    {t('spyDesc', lang)}
                  </div>
                </>
              ) : (
                /* NORMAL PLAYER ROLE */
                <>
                  <div className="inline-flex p-4 bg-[#00ff88]/10 border border-[#00ff88]/40 rounded-2xl text-5xl shadow-[0_0_20px_rgba(0,255,136,0.3)]">
                    💡
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#00ff88] bg-[#00ff88]/10 border border-[#00ff88]/40 px-3 py-1 rounded-full uppercase tracking-wider">
                      {t('insideLoop', lang)}
                    </span>
                    <p className="text-xs text-[#8888b0] mt-2">{t('secretWordIs', lang)}</p>
                    <h2 className="text-3xl sm:text-4xl font-black text-[#00ff88] tracking-wide mt-1 bg-black/40 py-2.5 rounded-xl border border-[#00ff88]/40 shadow-[0_0_15px_rgba(0,255,136,0.2)]">
                      {room.targetWord}
                    </h2>
                  </div>
                  <div className="p-3 bg-black/40 border border-[#00ff88]/30 rounded-xl text-xs text-[#e0e0f0] leading-relaxed max-w-xs mx-auto">
                    {t('playerDesc', lang)}
                  </div>
                </>
              )}

              <button
                onClick={toggleReveal}
                id="hide-role-btn"
                className="text-xs text-[#8888b0] hover:text-[#e0e0f0] flex items-center gap-1 mx-auto pt-2 cursor-pointer"
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>{t('hideRoleBtn', lang)}</span>
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Confirmation Action */}
      <div className="space-y-3">
        <button
          disabled={hasConfirmed}
          onClick={handleConfirm}
          id="role-understood-btn"
          className={`w-full py-4 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-2 shadow-xl ${
            hasConfirmed
              ? 'bg-[#00ff88]/15 border border-[#00ff88]/60 text-[#00ff88] cursor-default'
              : 'bg-gradient-to-r from-[#ff5f1f] to-[#e64a00] hover:brightness-110 text-white shadow-[0_10px_30px_rgba(255,95,31,0.4)] cursor-pointer active:scale-98'
          }`}
        >
          {hasConfirmed ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-[#00ff88]" />
              <span>{t('roleUnderstoodConfirmed', lang)}</span>
            </>
          ) : (
            <span>{t('roleUnderstoodBtn', lang)}</span>
          )}
        </button>

        {/* Live Progress Bar */}
        <div className="bg-[#16162d]/90 border border-white/10 rounded-2xl p-3 text-center space-y-1.5 backdrop-blur-md">
          <div className="flex justify-between text-xs font-bold text-[#8888b0] px-1">
            <span>{t('playersReadiness', lang)}</span>
            <span className="text-[#00ff88] font-mono">{confirmedCount} / {totalPlayers}</span>
          </div>
          <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
            <div
              className="h-full bg-[#00ff88] shadow-[0_0_10px_#00ff88] transition-all duration-500"
              style={{ width: `${(confirmedCount / totalPlayers) * 100}%` }}
            />
          </div>
          <p className="text-[10px] text-[#8888b0]">{t('autoNextMsg', lang)}</p>
        </div>
      </div>

    </div>
  );
};
