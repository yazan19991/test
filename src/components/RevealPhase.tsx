import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw } from 'lucide-react';
import { RoomState } from '../types';
import { sounds } from '../lib/audio';
import { t, Language } from '../data/translations';

interface RevealPhaseProps {
  room: RoomState;
  currentPlayerId: string | null;
  onRestartGame: () => void;
}

export const RevealPhase: React.FC<RevealPhaseProps> = ({ room, currentPlayerId, onRestartGame }) => {
  const lang: Language = room.language || 'ar';
  const isRtl = lang === 'ar';

  const isSpyWin = room.winnerTeam === 'SPY';
  const spyPlayer = room.players.find(p => p.id === room.spyId);

  // Trigger Confetti and Win/Loss Sound on mount
  useEffect(() => {
    if (isSpyWin) {
      sounds.loss();
    } else {
      sounds.win();
    }

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // Fallback
    }
  }, [isSpyWin]);

  const handleRestart = () => {
    sounds.phaseChange();
    onRestartGame();
  };

  const isHost = room.hostId === currentPlayerId;

  return (
    <div className={`w-full max-w-xl mx-auto p-4 sm:p-6 space-y-6 ${isRtl ? 'dir-rtl' : 'dir-ltr'}`}>
      
      {/* Winner Hero Banner */}
      <div className={`rounded-3xl p-6 sm:p-8 text-center shadow-2xl border relative overflow-hidden ${
        isSpyWin
          ? 'bg-gradient-to-b from-rose-950 via-slate-900 to-slate-950 border-rose-600/80 shadow-rose-950/50'
          : 'bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950 border-emerald-500/80 shadow-emerald-950/50'
      }`}>
        
        <div className="inline-flex p-4 rounded-3xl bg-slate-900 border border-slate-700 text-5xl mb-2 shadow-inner">
          {isSpyWin ? '🕵️‍♂️' : '🥳'}
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-white">
          {isSpyWin ? t('spyWonTitle', lang) : t('playersWonTitle', lang)}
        </h1>

        <p className="text-sm font-bold mt-2 text-purple-200/90 max-w-sm mx-auto">
          {room.gameOverReason === 'WRONG_ACCUSATION' && t('reasonWrongAccusation', lang)}
          {room.gameOverReason === 'CORRECT_GUESS' && t('reasonCorrectGuess', lang)}
          {room.gameOverReason === 'WRONG_GUESS' && t('reasonWrongGuess', lang, { word: room.spyGuessResult?.guessedWord || '' })}
        </p>

      </div>

      {/* Secret Word & Spy Identity Card */}
      <div className="bg-[#16162d]/90 border border-white/10 rounded-3xl p-5 shadow-xl grid grid-cols-1 sm:grid-cols-2 gap-4 backdrop-blur-md">
        
        <div className="p-4 bg-black/40 border border-[#00ff88]/50 rounded-2xl text-center shadow-[0_0_15px_rgba(0,255,136,0.2)]">
          <div className="text-xs font-bold text-[#00ff88] mb-1">{t('secretWordTitle', lang)}</div>
          <div className="text-2xl font-black text-[#00ff88]">
            {room.targetWord || (lang === 'en' ? 'Unknown' : 'غير معروف')}
          </div>
        </div>

        <div className="p-4 bg-black/40 border border-[#ff5f1f]/50 rounded-2xl text-center shadow-[0_0_15px_rgba(255,95,31,0.2)]">
          <div className="text-xs font-bold text-[#ff5f1f] mb-1">{t('spyIdentityTitle', lang)}</div>
          <div className="text-xl font-black text-[#e0e0f0] flex items-center justify-center gap-2">
            <span>{spyPlayer?.avatar}</span>
            <span>{spyPlayer?.name || (lang === 'en' ? 'The Spy' : 'الجاسوس')}</span>
          </div>
        </div>

      </div>

      {/* Vote Tally Breakdown */}
      {room.voteResults && room.voteResults.length > 0 && (
        <div className="bg-[#16162d]/90 border border-white/10 rounded-3xl p-5 shadow-xl space-y-3 backdrop-blur-md">
          <h3 className="font-bold text-sm text-[#e0e0f0]">{t('voteResultsTitle', lang)}</h3>
          
          <div className="space-y-2">
            {room.voteResults.map((res) => (
              <div
                key={res.suspectId}
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  res.isSpy
                    ? 'bg-rose-950/60 border-rose-600/80 text-rose-100'
                    : 'bg-white/5 border-white/5 text-[#e0e0f0]'
                }`}
              >
                <div>
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    <span>{res.suspectName}</span>
                    {res.isSpy && (
                      <span className="text-[10px] bg-rose-900 text-rose-200 px-1.5 py-0.2 rounded font-mono">
                        ({lang === 'en' ? 'Spy' : 'الجاسوس'})
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-[#8888b0] mt-0.5">
                    {t('votersLabel', lang)} {res.voters.join(', ')}
                  </div>
                </div>

                <div className="font-mono font-black text-sm px-2.5 py-1 bg-black/40 rounded-lg text-[#ff5f1f] border border-white/10">
                  {t('votesCountText', lang, { count: res.votesCount })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Restart / Next Round Action */}
      <div className="pt-2">
        {isHost ? (
          <button
            onClick={handleRestart}
            id="restart-game-btn"
            className="w-full py-4 bg-gradient-to-r from-[#ff5f1f] to-[#e64a00] hover:brightness-110 text-white font-extrabold text-base rounded-2xl shadow-[0_10px_30px_rgba(255,95,31,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
          >
            <RotateCcw className="w-5 h-5" />
            <span>{t('playAgainBtn', lang)}</span>
          </button>
        ) : (
          <div className="p-4 bg-[#16162d]/80 border border-white/10 rounded-2xl text-center text-xs text-[#8888b0] font-medium animate-pulse">
            {t('waitingForHostNext', lang)}
          </div>
        )}
      </div>

    </div>
  );
};
