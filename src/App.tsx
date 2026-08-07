import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { RoomState } from './types';
import { Header } from './components/Header';
import { Lobby } from './components/Lobby';
import { RoleView } from './components/RoleView';
import { QuestioningPhase } from './components/QuestioningPhase';
import { VotingPhase } from './components/VotingPhase';
import { SpyGuessing } from './components/SpyGuessing';
import { RevealPhase } from './components/RevealPhase';
import { ChatDrawer } from './components/ChatDrawer';
import { RulesModal } from './components/RulesModal';
import { sounds } from './lib/audio';
import { Language } from './data/translations';

let socket: Socket | null = null;

export default function App() {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  // Initialize Socket.io Connection
  useEffect(() => {
    socket = io({
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket?.id);
      
      // Auto reconnect session if stored
      const storedRoom = sessionStorage.getItem('barra_salfa_room');
      const storedName = sessionStorage.getItem('barra_salfa_name');
      const storedPlayerId = sessionStorage.getItem('barra_salfa_player_id');

      if (storedRoom && storedName) {
        socket?.emit('join_room', {
          roomCode: storedRoom,
          playerName: storedName,
          existingPlayerId: storedPlayerId,
        }, (res: any) => {
          if (res?.success) {
            setCurrentPlayerId(res.playerId);
          } else {
            sessionStorage.removeItem('barra_salfa_room');
          }
        });
      }
    });

    socket.on('room_updated', (updatedRoom: RoomState) => {
      setRoom(updatedRoom);
      if (updatedRoom?.code) {
        sessionStorage.setItem('barra_salfa_room', updatedRoom.code);
      }
    });

    socket.on('error_message', (msg: string) => {
      setErrorMessage(msg);
      sounds.loss();
      setTimeout(() => setErrorMessage(null), 4000);
    });

    socket.on('kicked', () => {
      setRoom(null);
      setCurrentPlayerId(null);
      sessionStorage.clear();
      setErrorMessage('تم طردك من قبل منشئ الغرفة.');
    });

    return () => {
      socket?.disconnect();
    };
  }, []);

  // Handlers
  const handleCreateRoom = (playerName: string, avatar: string, categoryId: string, language: Language) => {
    socket?.emit('create_room', { playerName, avatar, categoryId, language }, (res: any) => {
      if (res?.success) {
        setCurrentPlayerId(res.playerId);
        sessionStorage.setItem('barra_salfa_room', res.roomCode);
        sessionStorage.setItem('barra_salfa_name', playerName);
        sessionStorage.setItem('barra_salfa_player_id', res.playerId);
      }
    });
  };

  const handleJoinRoom = (roomCode: string, playerName: string, avatar: string) => {
    socket?.emit('join_room', { roomCode, playerName, avatar }, (res: any) => {
      if (res?.success) {
        setCurrentPlayerId(res.playerId);
        sessionStorage.setItem('barra_salfa_room', res.roomCode);
        sessionStorage.setItem('barra_salfa_name', playerName);
        sessionStorage.setItem('barra_salfa_player_id', res.playerId);
      } else if (res?.message) {
        setErrorMessage(res.message);
        setTimeout(() => setErrorMessage(null), 4000);
      }
    });
  };

  const handleUpdateCategory = (categoryId: string) => {
    socket?.emit('update_category', { categoryId });
  };

  const handleAddCustomPack = (name: string, icon: string, description: string, words: string[]) => {
    socket?.emit('add_custom_pack', { name, icon, description, words });
  };

  const handleStartGame = () => {
    socket?.emit('start_game');
  };

  const handleConfirmRole = () => {
    socket?.emit('confirm_role');
  };

  const handleToggleReadyVote = () => {
    socket?.emit('toggle_ready_vote');
  };

  const handleCastVote = (suspectId: string) => {
    socket?.emit('cast_vote', { suspectId });
  };

  const handleSpyGuess = (guessedWord: string) => {
    socket?.emit('spy_guess', { guessedWord });
  };

  const handleRestartGame = () => {
    socket?.emit('restart_game');
  };

  const handleSendChat = (text: string) => {
    socket?.emit('send_chat', { text, type: 'chat' });
  };

  const handleSendReaction = (emoji: string) => {
    socket?.emit('send_chat', { text: `${emoji}`, type: 'reaction' });
  };

  const handleKickPlayer = (playerIdToKick: string) => {
    socket?.emit('kick_player', { playerIdToKick });
  };

  // Render current phase view
  const renderPhaseView = () => {
    if (!room || room.phase === 'LOBBY') {
      return (
        <Lobby
          room={room}
          currentPlayerId={currentPlayerId}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onUpdateCategory={handleUpdateCategory}
          onAddCustomPack={handleAddCustomPack}
          onStartGame={handleStartGame}
          onKickPlayer={handleKickPlayer}
        />
      );
    }

    switch (room.phase) {
      case 'ROLE_ASSIGNMENT':
        return (
          <RoleView
            room={room}
            currentPlayerId={currentPlayerId}
            onConfirmRole={handleConfirmRole}
          />
        );

      case 'QUESTIONING':
        return (
          <QuestioningPhase
            room={room}
            currentPlayerId={currentPlayerId}
            onToggleReadyVote={handleToggleReadyVote}
            onSendReaction={handleSendReaction}
          />
        );

      case 'VOTING':
        return (
          <VotingPhase
            room={room}
            currentPlayerId={currentPlayerId}
            onCastVote={handleCastVote}
          />
        );

      case 'SPY_GUESSING':
        return (
          <SpyGuessing
            room={room}
            currentPlayerId={currentPlayerId}
            onSpyGuess={handleSpyGuess}
          />
        );

      case 'GAME_OVER':
        return (
          <RevealPhase
            room={room}
            currentPlayerId={currentPlayerId}
            onRestartGame={handleRestartGame}
          />
        );

      default:
        return null;
    }
  };

  const currentLang = room?.language || 'ar';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-purple-500 selection:text-white flex flex-col">
      {/* Header */}
      <Header
        roomCode={room?.code}
        playerCount={room ? room.players.filter(p => p.isOnline).length : undefined}
        lang={currentLang}
        onOpenRules={() => setIsRulesOpen(true)}
      />

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="bg-rose-600 text-white text-xs font-bold py-2.5 px-4 text-center shadow-lg animate-fadeIn z-50">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 flex items-center justify-center py-6 px-2 sm:px-4">
        {renderPhaseView()}
      </main>

      {/* Chat Drawer if inside room */}
      {room && (
        <ChatDrawer
          messages={room.chatMessages || []}
          currentPlayerId={currentPlayerId}
          lang={currentLang}
          onSendMessage={handleSendChat}
        />
      )}

      {/* Game Rules Modal */}
      <RulesModal
        isOpen={isRulesOpen}
        lang={currentLang}
        onClose={() => setIsRulesOpen(false)}
      />
    </div>
  );
}
