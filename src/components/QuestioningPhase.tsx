import React, { useState, useEffect } from 'react';
import { Timer, Vote, Mic, Check, AlertCircle } from 'lucide-react';
import { RoomState } from '../types';
import { sounds } from '../lib/audio';
import { t, Language } from '../data/translations';

interface QuestioningPhaseProps {
  room: RoomState;
  currentPlayerId: string | null;
  onToggleReadyVote: () => void;
  onSendReaction: (emoji: string) => void;
}

const EMOJI_REACTIONS = ['🤫', '👀', '🕵️‍♂️', '💡', '🤥', '😂', '🔥', '🤔'];

export const QuestioningPhase: React.FC<QuestioningPhaseProps> = ({
  room,
  currentPlayerId,
  onToggleReadyVote,
  onSendReaction,
}) => {
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  const lang: Language = room.language || 'ar';
  const isRtl = lang === 'ar';

  // Synced Timer Effect
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsElapsed(s => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const me = room.players.find(p => p.id === currentPlayerId);
  const isReady = me?.readyToVote || false;

  const totalPlayers = room.totalPlayers || room.players.filter(p => p.isOnline).length;
  const readyCount = room.readyToVoteCount;
  const neededVotes = Math.floor(totalPlayers / 2) + 1; // More than half!

  const handleReadyClick = () => {
    sounds.ready();
    onToggleReadyVote();
  };

  const handleEmojiClick = (emoji: string) => {
    sounds.click();
    onSendReaction(emoji);
  };

  return (
    <div className={`w-full max-w-xl mx-auto p-4 sm:p-6 space-y-6 ${isRtl ? 'dir-rtl' : 'dir-ltr'}`}>
      
      {/* Timer & Category Banner */}
      <div className="bg-[#16162d]/90 border border-white/10 rounded-3xl p-5 text-center shadow-xl flex items-center justify-between gap-4 backdrop-blur-md">
        <div className={isRtl ? 'text-right' : 'text-left'}>
          <div className="text-xs font-bold text-[#8888b0]">{t('questioningPhaseTitle', lang)}</div>
          <div className="text-base font-black text-[#ff5f1f]">{room.categoryName}</div>
        </div>

        <div className="flex items-center gap-2 bg-black/40 border border-[#ff5f1f]/50 px-4 py-2 rounded-2xl shadow-[0_0_15px_rgba(255,95,31,0.3)] font-mono font-black text-2xl text-[#ff5f1f]">
          <Timer className="w-5 h-5 text-[#ff5f1f] animate-pulse" />
          <span>{formatTime(secondsElapsed)}</span>
        </div>
      </div>

      {/* Designated Starter Card */}
      {room.startingPlayerName && (
        <div className="bg-[#ff5f1f]/10 border border-[#ff5f1f]/40 rounded-3xl p-4 text-center shadow-[0_0_20px_rgba(255,95,31,0.2)] relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-center gap-2 text-[#ff5f1f] font-bold text-xs mb-1">
            <Mic className="w-4 h-4 text-[#ff5f1f]" />
            <span>{t('firstPlayerToAsk', lang)}</span>
          </div>
          <div className="text-xl font-black text-[#e0e0f0]">
            {room.startingPlayerName} 🎤
          </div>
          <p className="text-[11px] text-[#8888b0] mt-1">
            {t('starterDesc', lang)}
          </p>
        </div>
      )}

      {/* Players Questioning Grid */}
      <div className="bg-[#16162d]/90 border border-white/10 rounded-3xl p-5 shadow-xl space-y-3 backdrop-blur-md">
        <div className="flex items-center justify-between text-xs font-bold text-[#8888b0]">
          <span>{t('votingReadinessStatus', lang)}</span>
          <span className="text-[#00ff88] font-mono">{t('readyCountText', lang, { count: readyCount, total: totalPlayers })}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {room.players.map((p) => (
            <div
              key={p.id}
              className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                p.readyToVote
                  ? 'bg-[#00ff88]/10 border-[#00ff88] text-white shadow-[0_0_10px_rgba(0,255,136,0.2)]'
                  : 'bg-white/5 border-white/5 text-[#8888b0]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{p.avatar}</span>
                <div>
                  <div className="font-bold text-xs flex items-center gap-1 text-[#e0e0f0]">
                    <span>{p.name}</span>
                    {p.id === currentPlayerId && (
                      <span className="text-[9px] bg-[#ff5f1f] px-1.5 py-0.2 rounded text-white font-bold">{t('you', lang)}</span>
                    )}
                  </div>
                  <div className="text-[10px] text-[#8888b0]">
                    {p.readyToVote ? t('readyToVoteStatus', lang) : t('discussingStatus', lang)}
                  </div>
                </div>
              </div>

              {p.readyToVote && (
                <div className="w-6 h-6 rounded-full bg-[#00ff88]/20 border border-[#00ff88] flex items-center justify-center text-[#00ff88]">
                  <Check className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Prominent Vote Trigger Button */}
      <div className="space-y-3">
        <button
          onClick={handleReadyClick}
          id="ready-to-vote-btn"
          className={`w-full py-4 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-2.5 shadow-2xl cursor-pointer active:scale-98 ${
            isReady
              ? 'bg-[#00ff88]/20 border border-[#00ff88] text-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.3)]'
              : 'bg-gradient-to-r from-[#ff5f1f] to-[#e64a00] hover:brightness-110 text-white shadow-[0_10px_30px_rgba(255,95,31,0.4)]'
          }`}
        >
          <Vote className="w-6 h-6" />
          <span>{isReady ? t('readyCancelBtn', lang) : t('readyToVoteBtn', lang)}</span>
        </button>

        {/* Voting Threshold Progress Bar */}
        <div className="bg-[#16162d]/90 border border-white/10 rounded-2xl p-3.5 text-center space-y-2 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs font-bold text-[#8888b0] px-1">
            <span className="flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-[#ff5f1f]" />
              <span>{t('votingConditionTitle', lang)}</span>
            </span>
            <span className="text-[#00ff88] font-bold">{t('votesNeededText', lang, { count: neededVotes })}</span>
          </div>

          <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/5">
            <div
              className="h-full bg-[#00ff88] shadow-[0_0_10px_#00ff88] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (readyCount / neededVotes) * 100)}%` }}
            />
          </div>

          <p className="text-[10px] text-[#8888b0]">
            {t('votingConditionDesc', lang, { count: neededVotes })}
          </p>
        </div>
      </div>

      {/* Quick Reaction Bar */}
      <div className="bg-[#16162d]/90 border border-white/10 rounded-2xl p-3 text-center backdrop-blur-md">
        <div className="text-[11px] font-bold text-[#8888b0] mb-2">{t('quickReactionsTitle', lang)}</div>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {EMOJI_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleEmojiClick(emoji)}
              className="p-2 rounded-xl bg-white/5 hover:bg-[#ff5f1f]/20 border border-white/5 text-xl transition-all cursor-pointer hover:scale-110 active:scale-90"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};
