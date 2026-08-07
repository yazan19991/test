import React, { useState } from 'react';
import { Play, Plus, Crown, Copy, Check, Users, Sparkles, Trash2, Settings2, Globe } from 'lucide-react';
import { getDefaultCategories } from '../data/categories';
import { CategoryPack, Player, RoomState } from '../types';
import { sounds } from '../lib/audio';
import { t, Language } from '../data/translations';

interface LobbyProps {
  room: RoomState | null;
  currentPlayerId: string | null;
  onCreateRoom: (playerName: string, avatar: string, categoryId: string, language: Language) => void;
  onJoinRoom: (roomCode: string, playerName: string, avatar: string) => void;
  onUpdateCategory: (categoryId: string) => void;
  onAddCustomPack: (name: string, icon: string, description: string, words: string[]) => void;
  onStartGame: () => void;
  onKickPlayer: (playerId: string) => void;
}

const AVATARS = ['🕵️‍♂️', '🥸', '👑', '🥷', '🦊', '🦁', '👻', '🤖', '🎭', '🧙', '🚀', '💎'];

export const Lobby: React.FC<LobbyProps> = ({
  room,
  currentPlayerId,
  onCreateRoom,
  onJoinRoom,
  onUpdateCategory,
  onAddCustomPack,
  onStartGame,
  onKickPlayer,
}) => {
  const [playerName, setPlayerName] = useState('');
  const [avatar, setAvatar] = useState('🕵️‍♂️');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [selectedLang, setSelectedLang] = useState<Language>('ar');
  const [selectedCatId, setSelectedCatId] = useState('food');
  const [copiedCode, setCopiedCode] = useState(false);

  // Custom Pack Modal State
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customWordsInput, setCustomWordsInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const activeLang: Language = room?.language || selectedLang;
  const isRtl = activeLang === 'ar';

  const isHost = room && currentPlayerId ? room.hostId === currentPlayerId : false;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setErrorMsg(activeLang === 'en' ? 'Please enter your name first!' : 'الرجاء كتابة اسمك أولاً!');
      return;
    }
    setErrorMsg('');
    sounds.click();
    onCreateRoom(playerName.trim(), avatar, selectedCatId, selectedLang);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setErrorMsg(activeLang === 'en' ? 'Please enter your name first!' : 'الرجاء كتابة اسمك أولاً!');
      return;
    }
    if (!roomCodeInput.trim()) {
      setErrorMsg(activeLang === 'en' ? 'Please enter 4-letter room code!' : 'الرجاء أدخال رمز الغرفة المكون من 4 أحرف!');
      return;
    }
    setErrorMsg('');
    sounds.click();
    onJoinRoom(roomCodeInput.trim().toUpperCase(), playerName.trim(), avatar);
  };

  const handleCustomPackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const words = customWordsInput.split(/[\n,،]+/).map(w => w.trim()).filter(Boolean);
    if (!customName.trim()) {
      setErrorMsg(activeLang === 'en' ? 'Please enter pack name' : 'الرجاء كتابة اسم الباقة المخصصة');
      return;
    }
    if (words.length < 4) {
      setErrorMsg(activeLang === 'en' ? 'Enter at least 4 words!' : 'يجب إدخال 4 كلمات على الأقل للباقة المخصصة!');
      return;
    }
    sounds.click();
    onAddCustomPack(customName.trim(), 'Sparkles', activeLang === 'en' ? 'Custom Pack' : 'باقة مخصصة من اللاعب', words);
    setShowCustomModal(false);
    setCustomName('');
    setCustomWordsInput('');
    setErrorMsg('');
  };

  const copyCode = () => {
    if (!room?.code) return;
    navigator.clipboard.writeText(room.code);
    setCopiedCode(true);
    sounds.click();
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // If NOT inside a room yet: Entry Form
  if (!room) {
    const categoriesForSelection = getDefaultCategories(selectedLang);

    return (
      <div className={`w-full max-w-md mx-auto p-4 sm:p-6 ${isRtl ? 'dir-rtl' : 'dir-ltr'}`}>
        <div className="bg-[#16162d]/90 border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
          
          {/* Logo & Intro */}
          <div className="text-center mb-6">
            <div className="inline-flex p-3 bg-[#ff5f1f] border border-[#ff5f1f] rounded-2xl mb-3 text-4xl shadow-[0_0_20px_rgba(255,95,31,0.4)]">
              🕵️‍♂️
            </div>
            <h2 className="text-2xl font-black text-[#e0e0f0]">{t('welcomeTitle', selectedLang)}</h2>
            <p className="text-xs text-[#8888b0] mt-1">{t('welcomeDesc', selectedLang)}</p>
          </div>

          {/* Name & Avatar Selector */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-bold text-[#8888b0] mb-1.5">{t('yourName', selectedLang)}</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder={t('enterNamePlaceholder', selectedLang)}
                maxLength={15}
                id="player-name-input"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#ff5f1f] text-[#e0e0f0] placeholder-[#8888b0] focus:outline-none transition-all font-semibold text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#8888b0] mb-1.5">{t('chooseAvatar', selectedLang)}</label>
              <div className="grid grid-cols-6 gap-2">
                {AVATARS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setAvatar(emoji);
                      sounds.click();
                    }}
                    className={`p-2.5 rounded-xl text-xl text-center transition-all cursor-pointer ${
                      avatar === emoji
                        ? 'bg-[#ff5f1f] border-2 border-[#ff5f1f] shadow-[0_0_15px_rgba(255,95,31,0.5)] scale-105'
                        : 'bg-white/5 hover:bg-white/10 border border-white/5'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Create / Join Tabs */}
          <div className="grid grid-cols-2 gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5 mb-6">
            <button
              onClick={() => {
                setActiveTab('create');
                sounds.click();
              }}
              id="tab-create-room"
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'create' ? 'bg-[#ff5f1f] text-white shadow-[0_0_15px_rgba(255,95,31,0.4)]' : 'text-[#8888b0] hover:text-[#e0e0f0]'
              }`}
            >
              {t('createRoomTab', selectedLang)}
            </button>
            <button
              onClick={() => {
                setActiveTab('join');
                sounds.click();
              }}
              id="tab-join-room"
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'join' ? 'bg-[#ff5f1f] text-white shadow-[0_0_15px_rgba(255,95,31,0.4)]' : 'text-[#8888b0] hover:text-[#e0e0f0]'
              }`}
            >
              {t('joinRoomTab', selectedLang)}
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 text-xs font-semibold text-center">
              {errorMsg}
            </div>
          )}

          {/* Create Room Form */}
          {activeTab === 'create' ? (
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              
              {/* Language Selection Buttons */}
              <div>
                <label className="block text-xs font-bold text-[#8888b0] mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#ff5f1f]" />
                  <span>{t('chooseLanguage', selectedLang)}</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLang('ar');
                      setSelectedCatId('food');
                      sounds.click();
                    }}
                    id="lang-ar-btn"
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      selectedLang === 'ar'
                        ? 'bg-[#ff5f1f] border-[#ff5f1f] text-white shadow-[0_0_15px_rgba(255,95,31,0.4)]'
                        : 'bg-white/5 border-white/10 text-[#8888b0] hover:bg-white/10'
                    }`}
                  >
                    <span>العربية 🇸🇦</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLang('en');
                      setSelectedCatId('food');
                      sounds.click();
                    }}
                    id="lang-en-btn"
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      selectedLang === 'en'
                        ? 'bg-[#ff5f1f] border-[#ff5f1f] text-white shadow-[0_0_15px_rgba(255,95,31,0.4)]'
                        : 'bg-white/5 border-white/10 text-[#8888b0] hover:bg-white/10'
                    }`}
                  >
                    <span>English 🇬🇧</span>
                  </button>
                </div>
              </div>

              {/* Category selector */}
              <div>
                <label className="block text-xs font-bold text-[#8888b0] mb-1.5">{t('chooseCategory', selectedLang)}</label>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                  {categoriesForSelection.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCatId(cat.id);
                        sounds.click();
                      }}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                        isRtl ? 'text-right' : 'text-left'
                      } ${
                        selectedCatId === cat.id
                          ? 'bg-[#ff5f1f]/20 border-[#ff5f1f] text-white shadow-[0_0_12px_rgba(255,95,31,0.3)]'
                          : 'bg-white/5 hover:bg-white/10 border-white/5 text-[#8888b0]'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs text-[#e0e0f0]">{cat.name}</div>
                        <div className="text-[10px] text-[#8888b0]">{cat.description}</div>
                      </div>
                      <span className="text-xs font-mono text-[#ff5f1f] bg-black/40 px-2 py-0.5 rounded border border-white/5">
                        {cat.words.length} {t('wordsCount', selectedLang)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                id="create-room-btn"
                className="w-full py-3.5 bg-gradient-to-r from-[#ff5f1f] to-[#e64a00] hover:brightness-110 text-white font-extrabold text-sm rounded-xl shadow-[0_10px_30px_rgba(255,95,31,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{t('createRoomBtn', selectedLang)}</span>
              </button>
            </form>
          ) : (
            /* Join Room Form */
            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#8888b0] mb-1.5">{t('enterRoomCode', selectedLang)}</label>
                <input
                  type="text"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  placeholder={t('roomCodePlaceholder', selectedLang)}
                  maxLength={4}
                  id="room-code-input"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#ff5f1f] text-center font-mono font-black text-xl tracking-widest text-[#ff5f1f] placeholder-[#8888b0]/50 focus:outline-none uppercase"
                />
              </div>

              <button
                type="submit"
                id="join-room-btn"
                className="w-full py-3.5 bg-gradient-to-r from-[#ff5f1f] to-[#e64a00] hover:brightness-110 text-white font-extrabold text-sm rounded-xl shadow-[0_10px_30px_rgba(255,95,31,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{t('joinRoomBtn', selectedLang)}</span>
              </button>
            </form>
          )}

        </div>
      </div>
    );
  }

  // Inside Room Lobby
  const defaultPacks = getDefaultCategories(room.language || 'ar');
  const allAvailablePacks = [...defaultPacks, ...(room.customPacks || [])];
  const totalPlayers = room.players.filter(p => p.isOnline).length;
  const canStart = totalPlayers >= 3;

  return (
    <div className={`w-full max-w-2xl mx-auto p-4 sm:p-6 space-y-6 ${isRtl ? 'dir-rtl' : 'dir-ltr'}`}>
      
      {/* Room Code Banner */}
      <div className="bg-[#16162d]/90 border border-white/10 rounded-3xl p-6 text-center shadow-2xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff5f1f]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="text-xs font-bold text-[#8888b0] mb-1">{t('yourRoomCode', activeLang)}</div>
        
        <div className="inline-flex items-center gap-3 bg-black/40 border border-[#ff5f1f]/40 px-6 py-2.5 rounded-2xl my-2 shadow-inner">
          <span className="font-mono font-black text-3xl text-[#ff5f1f] tracking-widest">{room.code}</span>
          <button
            onClick={copyCode}
            id="lobby-copy-btn"
            className="p-2 rounded-xl bg-[#ff5f1f] hover:bg-[#e64a00] text-white transition-colors cursor-pointer shadow-[0_0_10px_rgba(255,95,31,0.4)]"
            title={t('copyCode', activeLang)}
          >
            {copiedCode ? <Check className="w-5 h-5 text-[#00ff88]" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>

        <p className="text-xs text-[#8888b0] mt-2">{t('shareCodeDesc', activeLang)}</p>
      </div>

      {/* Category Pack Selector (Host can change, others can view) */}
      <div className="bg-[#16162d]/90 border border-white/10 rounded-3xl p-5 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-[#ff5f1f]" />
            <h3 className="font-bold text-sm text-[#e0e0f0]">{t('selectedPack', activeLang)}</h3>
          </div>
          {isHost && (
            <button
              onClick={() => setShowCustomModal(true)}
              id="add-custom-pack-btn"
              className="text-xs font-bold text-[#ff5f1f] hover:text-white flex items-center gap-1 bg-[#ff5f1f]/10 border border-[#ff5f1f]/30 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('addCustomPack', activeLang)}</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {allAvailablePacks.map((pack) => {
            const isSelected = room.categoryId === pack.id;
            return (
              <button
                key={pack.id}
                disabled={!isHost}
                onClick={() => {
                  if (isHost) {
                    sounds.click();
                    onUpdateCategory(pack.id);
                  }
                }}
                className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                  isRtl ? 'text-right' : 'text-left'
                } ${
                  isSelected
                    ? 'bg-[#ff5f1f]/20 border-[#ff5f1f] text-white shadow-[0_0_15px_rgba(255,95,31,0.3)]'
                    : 'bg-white/5 border-white/5 text-[#8888b0] hover:bg-white/10'
                } ${!isHost ? 'opacity-80 cursor-default' : 'cursor-pointer'}`}
              >
                <div className="font-bold text-xs truncate mb-1">{pack.name}</div>
                <div className="text-[10px] text-[#ff5f1f]">{pack.words.length} {t('wordsCount', activeLang)}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Connected Players List */}
      <div className="bg-[#16162d]/90 border border-white/10 rounded-3xl p-5 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#ff5f1f]" />
            <h3 className="font-bold text-sm text-[#e0e0f0]">{t('connectedPlayers', activeLang)} ({totalPlayers})</h3>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
            canStart ? 'bg-[#00ff88]/10 border-[#00ff88] text-[#00ff88] shadow-[0_0_10px_rgba(0,255,136,0.2)]' : 'bg-[#ff5f1f]/10 border-[#ff5f1f] text-[#ff5f1f]'
          }`}>
            {canStart ? t('readyToStart', activeLang) : t('needMorePlayers', activeLang, { n: 3 - totalPlayers })}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {room.players.map((p) => {
            const isMe = p.id === currentPlayerId;
            return (
              <div
                key={p.id}
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  isMe
                    ? 'bg-[#ff5f1f]/15 border-[#ff5f1f]/50 text-white'
                    : 'bg-white/5 border-white/5 text-[#e0e0f0]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl p-1.5 bg-black/40 rounded-xl border border-white/10">
                    {p.avatar}
                  </div>
                  <div>
                    <div className="font-bold text-sm flex items-center gap-1.5">
                      <span>{p.name}</span>
                      {isMe && <span className="text-[10px] bg-[#ff5f1f] text-white px-1.5 py-0.5 rounded font-bold">{t('you', activeLang)}</span>}
                      {p.isHost && (
                        <Crown className="w-3.5 h-3.5 text-[#ff5f1f] fill-[#ff5f1f]" title={t('host', activeLang)} />
                      )}
                    </div>
                    <div className="text-[10px] text-[#8888b0]">
                      {p.isOnline ? t('online', activeLang) : t('offline', activeLang)}
                    </div>
                  </div>
                </div>

                {isHost && !isMe && (
                  <button
                    onClick={() => {
                      sounds.click();
                      onKickPlayer(p.id);
                    }}
                    className="p-1.5 rounded-lg text-[#8888b0] hover:text-rose-400 hover:bg-rose-950/50 transition-colors cursor-pointer"
                    title={t('kickPlayer', activeLang)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Start Game Action */}
      <div className="pt-2">
        {isHost ? (
          <button
            disabled={!canStart}
            onClick={() => {
              if (canStart) {
                sounds.phaseChange();
                onStartGame();
              }
            }}
            id="host-start-game-btn"
            className={`w-full py-4 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-2 shadow-2xl ${
              canStart
                ? 'bg-gradient-to-r from-[#ff5f1f] to-[#e64a00] hover:brightness-110 text-white shadow-[0_10px_30px_rgba(255,95,31,0.4)] cursor-pointer active:scale-98'
                : 'bg-white/5 border border-white/10 text-[#8888b0] cursor-not-allowed'
            }`}
          >
            <Play className="w-5 h-5 fill-current" />
            <span>{t('startGameBtn', activeLang)}</span>
          </button>
        ) : (
          <div className="p-4 bg-[#16162d]/80 border border-white/10 rounded-2xl text-center text-xs text-[#8888b0] font-medium animate-pulse">
            {t('waitingForHost', activeLang)}
          </div>
        )}
      </div>

      {/* Custom Pack Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`bg-[#16162d] border border-white/10 rounded-3xl max-w-md w-full p-6 text-[#e0e0f0] shadow-2xl ${isRtl ? 'dir-rtl' : 'dir-ltr'}`}>
            <h3 className="text-lg font-bold text-[#ff5f1f] mb-2">{t('customPackHeader', activeLang)}</h3>
            <p className="text-xs text-[#8888b0] mb-4">{t('customPackDescText', activeLang)}</p>

            <form onSubmit={handleCustomPackSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#8888b0] mb-1">{t('packNameLabel', activeLang)}</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder={t('packNamePlaceholder', activeLang)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-[#ff5f1f]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#8888b0] mb-1">{t('wordsListLabel', activeLang)}</label>
                <textarea
                  rows={5}
                  value={customWordsInput}
                  onChange={(e) => setCustomWordsInput(e.target.value)}
                  placeholder={t('wordsPlaceholderText', activeLang)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#ff5f1f]"
                />
              </div>

              {errorMsg && <p className="text-xs text-rose-400 font-bold">{errorMsg}</p>}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  id="save-custom-pack-btn"
                  className="flex-1 py-2.5 bg-[#ff5f1f] hover:bg-[#e64a00] text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-[0_0_15px_rgba(255,95,31,0.4)]"
                >
                  {t('savePackBtn', activeLang)}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-[#8888b0] font-bold text-xs rounded-xl transition-colors cursor-pointer border border-white/10"
                >
                  {t('cancelBtn', activeLang)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
