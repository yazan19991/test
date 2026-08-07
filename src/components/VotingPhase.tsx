import React, { useState } from 'react';
import { Vote, CheckCircle2 } from 'lucide-react';
import { RoomState } from '../types';
import { sounds } from '../lib/audio';
import { t, Language } from '../data/translations';

interface VotingPhaseProps {
  room: RoomState;
  currentPlayerId: string | null;
  onCastVote: (suspectId: string) => void;
}

export const VotingPhase: React.FC<VotingPhaseProps> = ({ room, currentPlayerId, onCastVote }) => {
  const [selectedSuspectId, setSelectedSuspectId] = useState<string | null>(null);

  const lang: Language = room.language || 'ar';
  const isRtl = lang === 'ar';

  const me = room.players.find(p => p.id === currentPlayerId);
  const hasVoted = me?.votedFor !== undefined;

  const totalPlayers = room.totalPlayers || room.players.filter(p => p.isOnline).length;
  const votedCount = room.players.filter(p => p.votedFor && p.isOnline).length;

  const handleConfirmVote = () => {
    if (!selectedSuspectId) return;
    sounds.ready();
    onCastVote(selectedSuspectId);
  };

  return (
    <div className={`w-full max-w-lg mx-auto p-4 sm:p-6 space-y-6 ${isRtl ? 'dir-rtl' : 'dir-ltr'}`}>
      
      {/* Header Banner */}
      <div className="bg-[#16162d]/90 border border-white/10 rounded-3xl p-5 text-center shadow-xl space-y-1 backdrop-blur-md">
        <div className="inline-flex p-3 bg-[#ff5f1f] border border-[#ff5f1f] rounded-2xl text-3xl mb-1 shadow-[0_0_20px_rgba(255,95,31,0.4)]">
          🗳️
        </div>
        <h2 className="text-xl font-black text-[#e0e0f0]">{t('votingPhaseTitle', lang)}</h2>
        <p className="text-xs text-[#8888b0]">
          {t('votingPhaseDesc', lang)}
        </p>
      </div>

      {/* Players Suspect List */}
      <div className="space-y-3">
        <label className="block text-xs font-bold text-[#8888b0] px-1">{t('suspectsListTitle', lang)}</label>
        
        <div className="grid grid-cols-1 gap-3">
          {room.players.map((p) => {
            const isMe = p.id === currentPlayerId;
            const isSelected = selectedSuspectId === p.id;

            return (
              <button
                key={p.id}
                disabled={hasVoted || isMe}
                onClick={() => {
                  if (!hasVoted && !isMe) {
                    setSelectedSuspectId(p.id);
                    sounds.click();
                  }
                }}
                className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between ${
                  isRtl ? 'text-right' : 'text-left'
                } ${
                  isSelected
                    ? 'bg-[#ff5f1f]/20 border-[#ff5f1f] text-white shadow-[0_0_20px_rgba(255,95,31,0.4)] scale-[1.02]'
                    : isMe
                    ? 'bg-black/30 border-white/5 text-[#8888b0] opacity-50 cursor-not-allowed'
                    : 'bg-white/5 border-white/10 text-[#e0e0f0] hover:bg-white/10 cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-3xl p-2 bg-black/40 rounded-xl border border-white/10">
                    {p.avatar}
                  </div>
                  <div>
                    <div className="font-bold text-sm flex items-center gap-1.5">
                      <span>{p.name}</span>
                      {isMe && <span className="text-[10px] bg-white/10 text-[#8888b0] px-1.5 py-0.5 rounded">({t('you', lang)})</span>}
                    </div>
                    <div className="text-[10px] text-[#8888b0]">
                      {isMe ? t('cannotVoteSelf', lang) : t('clickToSelect', lang)}
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <div className="px-3 py-1 bg-[#ff5f1f] text-white font-black text-xs rounded-lg shadow-[0_0_10px_rgba(255,95,31,0.4)]">
                    {t('selectedBadge', lang)}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Vote Submit Button */}
      {!hasVoted ? (
        <button
          disabled={!selectedSuspectId}
          onClick={handleConfirmVote}
          id="confirm-vote-btn"
          className={`w-full py-4 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-2 shadow-2xl ${
            selectedSuspectId
              ? 'bg-gradient-to-r from-[#ff5f1f] to-[#e64a00] hover:brightness-110 text-white shadow-[0_10px_30px_rgba(255,95,31,0.4)] cursor-pointer active:scale-98'
              : 'bg-white/5 border border-white/10 text-[#8888b0] cursor-not-allowed'
          }`}
        >
          <Vote className="w-5 h-5" />
          <span>{t('confirmVoteBtn', lang)}</span>
        </button>
      ) : (
        <div className="p-4 bg-[#00ff88]/10 border border-[#00ff88] rounded-2xl text-center space-y-1 shadow-[0_0_15px_rgba(0,255,136,0.2)]">
          <div className="flex items-center justify-center gap-2 text-[#00ff88] font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-[#00ff88]" />
            <span>{t('voteRecordedTitle', lang)}</span>
          </div>
          <p className="text-xs text-[#00ff88]/80">{t('waitingOthersVote', lang)}</p>
        </div>
      )}

      {/* Vote Progress */}
      <div className="bg-[#16162d]/90 border border-white/10 rounded-2xl p-3.5 text-center space-y-2 backdrop-blur-md">
        <div className="flex justify-between text-xs font-bold text-[#8888b0] px-1">
          <span>{t('votesProgressTitle', lang)}</span>
          <span className="text-[#00ff88] font-mono">{votedCount} / {totalPlayers}</span>
        </div>
        <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
          <div
            className="h-full bg-[#00ff88] shadow-[0_0_10px_#00ff88] transition-all duration-500"
            style={{ width: `${(votedCount / totalPlayers) * 100}%` }}
          />
        </div>
      </div>

    </div>
  );
};
