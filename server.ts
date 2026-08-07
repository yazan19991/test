import express from "express";
import http from "http";
import path from "path";
import { Server, Socket } from "socket.io";
import { createServer as createViteServer } from "vite";
import { getDefaultCategories } from "./src/data/categories";
import { t, Language } from "./src/data/translations";

const PORT = 3000;

interface PlayerData {
  id: string; // Session / Unique ID
  socketId: string;
  name: string;
  avatar: string;
  isHost: boolean;
  readyForNext: boolean;
  readyToVote: boolean;
  votedFor?: string;
  isOnline: boolean;
  score: number;
}

interface ServerRoom {
  code: string;
  hostId: string;
  language: Language;
  phase: 'LOBBY' | 'ROLE_ASSIGNMENT' | 'QUESTIONING' | 'VOTING' | 'SPY_GUESSING' | 'GAME_OVER';
  categoryId: string;
  categoryName: string;
  targetWord?: string;
  spyId?: string;
  players: Map<string, PlayerData>;
  startingPlayerName?: string;
  spyChoices?: string[];
  spyGuessResult?: {
    guessedWord: string;
    correctWord: string;
    isCorrect: boolean;
  };
  winnerTeam?: 'SPY' | 'PLAYERS';
  gameOverReason?: 'WRONG_ACCUSATION' | 'CORRECT_GUESS' | 'WRONG_GUESS';
  customPacks: any[];
  chatMessages: any[];
}

const rooms = new Map<string, ServerRoom>();

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed confusing chars like I, O, 0, 1
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return rooms.has(code) ? generateRoomCode() : code;
}

function getSanitizedRoomForPlayer(room: ServerRoom, playerId: string) {
  const playersList = Array.from(room.players.values()).map(p => ({
    id: p.id,
    name: p.name,
    avatar: p.avatar,
    isHost: p.isHost,
    readyForNext: p.readyForNext,
    readyToVote: p.readyToVote,
    votedFor: room.phase === 'GAME_OVER' || room.phase === 'VOTING' ? p.votedFor : (p.votedFor ? 'VOTED' : undefined),
    isOnline: p.isOnline,
    score: p.score,
  }));

  const isCurrentPlayerSpy = room.spyId === playerId;
  const isGameOver = room.phase === 'GAME_OVER';

  // Calculate vote results if in voting or game over
  let voteResults = undefined;
  if (isGameOver || room.phase === 'SPY_GUESSING') {
    const tally: Record<string, { suspectName: string; count: number; voters: string[] }> = {};
    for (const p of room.players.values()) {
      if (p.votedFor) {
        const suspect = room.players.get(p.votedFor);
        if (suspect) {
          if (!tally[p.votedFor]) {
            tally[p.votedFor] = { suspectName: suspect.name, count: 0, voters: [] };
          }
          tally[p.votedFor].count += 1;
          tally[p.votedFor].voters.push(p.name);
        }
      }
    }
    voteResults = Object.entries(tally).map(([suspectId, data]) => ({
      suspectId,
      suspectName: data.suspectName,
      votesCount: data.count,
      voters: data.voters,
      isSpy: suspectId === room.spyId,
    })).sort((a, b) => b.votesCount - a.votesCount);
  }

  const accusedPlayer = (room.phase === 'SPY_GUESSING' || isGameOver) && voteResults && voteResults.length > 0
    ? room.players.get(voteResults[0].suspectId)
    : undefined;

  const readyToVoteCount = Array.from(room.players.values()).filter(p => p.readyToVote && p.isOnline).length;
  const totalPlayers = Array.from(room.players.values()).filter(p => p.isOnline).length;

  return {
    code: room.code,
    hostId: room.hostId,
    language: room.language || 'ar',
    phase: room.phase,
    players: playersList,
    categoryId: room.categoryId,
    categoryName: room.categoryName,
    // Hide secret word from spy during active game!
    targetWord: (isCurrentPlayerSpy && !isGameOver) ? undefined : room.targetWord,
    isSpy: isCurrentPlayerSpy,
    spyId: isGameOver ? room.spyId : undefined,
    startingPlayerName: room.startingPlayerName,
    readyToVoteCount,
    totalPlayers,
    voteResults,
    accusedPlayer,
    spyGuessChoices: isCurrentPlayerSpy ? room.spyChoices : undefined,
    spyGuessResult: room.spyGuessResult,
    winnerTeam: room.winnerTeam,
    gameOverReason: room.gameOverReason,
    customPacks: room.customPacks,
    chatMessages: room.chatMessages.slice(-50),
  };
}

function broadcastRoomUpdate(io: Server, room: ServerRoom) {
  for (const player of room.players.values()) {
    if (player.isOnline && player.socketId) {
      const sanitized = getSanitizedRoomForPlayer(room, player.id);
      io.to(player.socketId).emit("room_updated", sanitized);
    }
  }
}

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  app.use(express.json());

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", activeRooms: rooms.size });
  });

  // Socket.IO Game Handlers
  io.on("connection", (socket: Socket) => {
    let currentRoomCode: string | null = null;
    let currentPlayerId: string | null = null;

    // 1. Create Room
    socket.on("create_room", ({ playerName, avatar, categoryId, language }, callback) => {
      const roomCode = generateRoomCode();
      const playerId = socket.id;
      const roomLang: Language = language === 'en' ? 'en' : 'ar';

      const defaultCats = getDefaultCategories(roomLang);
      const selectedCat = defaultCats.find(c => c.id === categoryId) || defaultCats[0];

      const room: ServerRoom = {
        code: roomCode,
        hostId: playerId,
        language: roomLang,
        phase: 'LOBBY',
        categoryId: selectedCat.id,
        categoryName: selectedCat.name,
        players: new Map(),
        customPacks: [],
        chatMessages: [{
          id: 'sys_' + Date.now(),
          senderId: 'SYSTEM',
          senderName: roomLang === 'en' ? 'System' : 'النظام',
          text: t('sysRoomCreated', roomLang, { code: roomCode, name: playerName }),
          timestamp: Date.now(),
          type: 'system',
        }],
      };

      const player: PlayerData = {
        id: playerId,
        socketId: socket.id,
        name: playerName,
        avatar: avatar || '🕵️‍♂️',
        isHost: true,
        readyForNext: false,
        readyToVote: false,
        isOnline: true,
        score: 0,
      };

      room.players.set(playerId, player);
      rooms.set(roomCode, room);

      currentRoomCode = roomCode;
      currentPlayerId = playerId;

      socket.join(roomCode);

      if (typeof callback === "function") {
        callback({ success: true, roomCode, playerId });
      }

      broadcastRoomUpdate(io, room);
    });

    // 2. Join Room
    socket.on("join_room", ({ roomCode, playerName, avatar, existingPlayerId }, callback) => {
      const cleanCode = (roomCode || "").toUpperCase().trim();
      const room = rooms.get(cleanCode);

      if (!room) {
        if (typeof callback === "function") {
          callback({ success: false, message: t('invalidRoomCode', 'ar') });
        }
        return;
      }

      // Reconnection logic
      let playerId = existingPlayerId || socket.id;
      let existingPlayer = room.players.get(playerId);

      if (!existingPlayer && existingPlayerId) {
        // Search by name if reconnecting
        existingPlayer = Array.from(room.players.values()).find(p => p.name === playerName);
        if (existingPlayer) {
          playerId = existingPlayer.id;
        }
      }

      if (room.phase !== 'LOBBY' && !existingPlayer) {
        if (typeof callback === "function") {
          callback({ success: false, message: t('gameAlreadyStarted', room.language) });
        }
        return;
      }

      if (existingPlayer) {
        // Reconnect existing player
        existingPlayer.socketId = socket.id;
        existingPlayer.isOnline = true;
        playerId = existingPlayer.id;
      } else {
        // Add new player
        playerId = socket.id;
        const newPlayer: PlayerData = {
          id: playerId,
          socketId: socket.id,
          name: playerName,
          avatar: avatar || '🥸',
          isHost: room.players.size === 0,
          readyForNext: false,
          readyToVote: false,
          isOnline: true,
          score: 0,
        };
        room.players.set(playerId, newPlayer);

        room.chatMessages.push({
          id: 'sys_' + Date.now(),
          senderId: 'SYSTEM',
          senderName: room.language === 'en' ? 'System' : 'النظام',
          text: t('sysPlayerJoined', room.language, { name: playerName }),
          timestamp: Date.now(),
          type: 'system',
        });
      }

      currentRoomCode = cleanCode;
      currentPlayerId = playerId;
      socket.join(cleanCode);

      if (typeof callback === "function") {
        callback({ success: true, roomCode: cleanCode, playerId });
      }

      broadcastRoomUpdate(io, room);
    });

    // 3. Update Category Pack (Host Only)
    socket.on("update_category", ({ categoryId }) => {
      if (!currentRoomCode) return;
      const room = rooms.get(currentRoomCode);
      if (!room) return;

      const player = room.players.get(socket.id);
      if (!player || !player.isHost) return;

      let defaultCats = getDefaultCategories(room.language);
      let allCategories = [...defaultCats, ...room.customPacks];
      const selected = allCategories.find(c => c.id === categoryId);
      if (selected) {
        room.categoryId = selected.id;
        room.categoryName = selected.name;
        broadcastRoomUpdate(io, room);
      }
    });

    // 4. Add Custom Category Pack
    socket.on("add_custom_pack", ({ name, icon, description, words }) => {
      if (!currentRoomCode) return;
      const room = rooms.get(currentRoomCode);
      if (!room) return;

      const player = room.players.get(socket.id);
      if (!player || !player.isHost) return;

      if (!words || words.length < 4) return;

      const newPack = {
        id: 'custom_' + Date.now(),
        name: name || (room.language === 'en' ? 'Custom Pack 🎨' : 'باقة مخصصة 🎨'),
        icon: icon || 'Sparkles',
        description: description || (room.language === 'en' ? 'Custom pack added by room host' : 'باقة أضيفت بواسطة منشئ الغرفة'),
        words: words.map((w: string) => w.trim()).filter(Boolean),
      };

      room.customPacks.push(newPack);
      room.categoryId = newPack.id;
      room.categoryName = newPack.name;

      broadcastRoomUpdate(io, room);
    });

    // 5. Start Game (Host Only, Min 3 players)
    socket.on("start_game", () => {
      if (!currentRoomCode) return;
      const room = rooms.get(currentRoomCode);
      if (!room) return;

      const hostPlayer = room.players.get(socket.id);
      if (!hostPlayer || !hostPlayer.isHost) return;

      const onlinePlayers = Array.from(room.players.values()).filter(p => p.isOnline);
      if (onlinePlayers.length < 3) {
        socket.emit("error_message", t('minPlayersError', room.language));
        return;
      }

      let defaultCats = getDefaultCategories(room.language);
      let allCategories = [...defaultCats, ...room.customPacks];
      const selectedCategory = allCategories.find(c => c.id === room.categoryId) || defaultCats[0];

      // Pick random word
      const targetWord = selectedCategory.words[Math.floor(Math.random() * selectedCategory.words.length)];

      // Pick random spy
      const spyIndex = Math.floor(Math.random() * onlinePlayers.length);
      const spyPlayer = onlinePlayers[spyIndex];

      // Reset player game states
      for (const p of room.players.values()) {
        p.readyForNext = false;
        p.readyToVote = false;
        p.votedFor = undefined;
      }

      // Pick starting questioner randomly
      const startingPlayer = onlinePlayers[Math.floor(Math.random() * onlinePlayers.length)];

      room.targetWord = targetWord;
      room.spyId = spyPlayer.id;
      room.phase = 'ROLE_ASSIGNMENT';
      room.startingPlayerName = startingPlayer.name;
      room.spyChoices = undefined;
      room.spyGuessResult = undefined;
      room.winnerTeam = undefined;
      room.gameOverReason = undefined;

      room.chatMessages.push({
        id: 'sys_' + Date.now(),
        senderId: 'SYSTEM',
        senderName: room.language === 'en' ? 'System' : 'النظام',
        text: t('sysRoundStarted', room.language, { category: selectedCategory.name }),
        timestamp: Date.now(),
        type: 'system',
      });

      broadcastRoomUpdate(io, room);
    });

    // 6. Confirm Role View ("فهمت الدور")
    socket.on("confirm_role", () => {
      if (!currentRoomCode) return;
      const room = rooms.get(currentRoomCode);
      if (!room || room.phase !== 'ROLE_ASSIGNMENT') return;

      const player = room.players.get(socket.id);
      if (!player) return;

      player.readyForNext = true;

      const onlinePlayers = Array.from(room.players.values()).filter(p => p.isOnline);
      const allConfirmed = onlinePlayers.every(p => p.readyForNext);

      if (allConfirmed) {
        // Auto transition to Questioning Phase!
        room.phase = 'QUESTIONING';
        room.chatMessages.push({
          id: 'sys_' + Date.now(),
          senderId: 'SYSTEM',
          senderName: room.language === 'en' ? 'System' : 'النظام',
          text: t('sysRoleConfirmed', room.language),
          timestamp: Date.now(),
          type: 'system',
        });
      }

      broadcastRoomUpdate(io, room);
    });

    // 7. Toggle Ready To Vote ("جاهز للتصويت 🗳️")
    socket.on("toggle_ready_vote", () => {
      if (!currentRoomCode) return;
      const room = rooms.get(currentRoomCode);
      if (!room || room.phase !== 'QUESTIONING') return;

      const player = room.players.get(socket.id);
      if (!player) return;

      player.readyToVote = !player.readyToVote;

      const onlinePlayers = Array.from(room.players.values()).filter(p => p.isOnline);
      const readyToVoteCount = onlinePlayers.filter(p => p.readyToVote).length;

      // Condition: readyToVoteCount > totalPlayers / 2
      if (readyToVoteCount > onlinePlayers.length / 2) {
        // Auto transition to Voting Phase!
        room.phase = 'VOTING';
        room.chatMessages.push({
          id: 'sys_' + Date.now(),
          senderId: 'SYSTEM',
          senderName: room.language === 'en' ? 'System' : 'النظام',
          text: t('sysVotingStarted', room.language),
          timestamp: Date.now(),
          type: 'system',
        });
      }

      broadcastRoomUpdate(io, room);
    });

    // 8. Cast Vote
    socket.on("cast_vote", ({ suspectId }) => {
      if (!currentRoomCode) return;
      const room = rooms.get(currentRoomCode);
      if (!room || room.phase !== 'VOTING') return;

      const player = room.players.get(socket.id);
      if (!player) return;

      player.votedFor = suspectId;

      const onlinePlayers = Array.from(room.players.values()).filter(p => p.isOnline);
      const allVoted = onlinePlayers.every(p => p.votedFor !== undefined);

      if (allVoted) {
        // Tally votes
        const voteCounts: Record<string, number> = {};
        for (const p of onlinePlayers) {
          if (p.votedFor) {
            voteCounts[p.votedFor] = (voteCounts[p.votedFor] || 0) + 1;
          }
        }

        // Find suspect with highest votes
        let maxVotes = -1;
        let mostVotedPlayerId: string | null = null;

        for (const [suspect, count] of Object.entries(voteCounts)) {
          if (count > maxVotes) {
            maxVotes = count;
            mostVotedPlayerId = suspect;
          }
        }

        const accusedPlayer = mostVotedPlayerId ? room.players.get(mostVotedPlayerId) : null;

        if (!accusedPlayer) {
          // Fallback if tie or no votes
          mostVotedPlayerId = onlinePlayers[0].id;
        }

        const isAccusedSpy = mostVotedPlayerId === room.spyId;

        if (!isAccusedSpy) {
          // Case A: Voted on an innocent player!
          // Spy Wins immediately!
          room.phase = 'GAME_OVER';
          room.winnerTeam = 'SPY';
          room.gameOverReason = 'WRONG_ACCUSATION';

          // Award score to Spy
          const spyPlayer = room.spyId ? room.players.get(room.spyId) : null;
          if (spyPlayer) spyPlayer.score += 100;

          room.chatMessages.push({
            id: 'sys_' + Date.now(),
            senderId: 'SYSTEM',
            senderName: room.language === 'en' ? 'System' : 'النظام',
            text: t('sysWrongAccusation', room.language),
            timestamp: Date.now(),
            type: 'system',
          });
        } else {
          // Case B: Successfully caught the Spy!
          // Spy transitions to guessing phase
          room.phase = 'SPY_GUESSING';

          let defaultCats = getDefaultCategories(room.language);
          let allCategories = [...defaultCats, ...room.customPacks];
          const selectedCategory = allCategories.find(c => c.id === room.categoryId) || defaultCats[0];

          // Pick 3 distractor words from category (excluding targetWord)
          const distractorPool = selectedCategory.words.filter(w => w !== room.targetWord);
          const shuffledDistractors = [...distractorPool].sort(() => Math.random() - 0.5);
          const distractors = shuffledDistractors.slice(0, 3);

          // Combine target word + 3 distractors, then shuffle
          const choices = [room.targetWord!, ...distractors].sort(() => Math.random() - 0.5);
          room.spyChoices = choices;

          room.chatMessages.push({
            id: 'sys_' + Date.now(),
            senderId: 'SYSTEM',
            senderName: room.language === 'en' ? 'System' : 'النظام',
            text: t('sysSpyExposed', room.language),
            timestamp: Date.now(),
            type: 'system',
          });
        }
      }

      broadcastRoomUpdate(io, room);
    });

    // 9. Spy Guessing Submission
    socket.on("spy_guess", ({ guessedWord }) => {
      if (!currentRoomCode) return;
      const room = rooms.get(currentRoomCode);
      if (!room || room.phase !== 'SPY_GUESSING') return;

      const player = room.players.get(socket.id);
      if (!player || player.id !== room.spyId) return;

      const isCorrect = guessedWord === room.targetWord;

      room.spyGuessResult = {
        guessedWord,
        correctWord: room.targetWord || "",
        isCorrect,
      };

      room.phase = 'GAME_OVER';

      if (isCorrect) {
        room.winnerTeam = 'SPY';
        room.gameOverReason = 'CORRECT_GUESS';
        player.score += 150; // Spy guessed correctly!
        room.chatMessages.push({
          id: 'sys_' + Date.now(),
          senderId: 'SYSTEM',
          senderName: room.language === 'en' ? 'System' : 'النظام',
          text: t('sysSpyCorrectGuess', room.language, { word: guessedWord }),
          timestamp: Date.now(),
          type: 'system',
        });
      } else {
        room.winnerTeam = 'PLAYERS';
        room.gameOverReason = 'WRONG_GUESS';

        // Award score to non-spy players
        for (const p of room.players.values()) {
          if (p.id !== room.spyId) {
            p.score += 50;
          }
        }

        room.chatMessages.push({
          id: 'sys_' + Date.now(),
          senderId: 'SYSTEM',
          senderName: room.language === 'en' ? 'System' : 'النظام',
          text: t('sysSpyWrongGuess', room.language),
          timestamp: Date.now(),
          type: 'system',
        });
      }

      broadcastRoomUpdate(io, room);
    });

    // 10. Restart Game / Return to Lobby
    socket.on("restart_game", () => {
      if (!currentRoomCode) return;
      const room = rooms.get(currentRoomCode);
      if (!room) return;

      const player = room.players.get(socket.id);
      if (!player || !player.isHost) return;

      room.phase = 'LOBBY';
      room.targetWord = undefined;
      room.spyId = undefined;
      room.startingPlayerName = undefined;
      room.spyChoices = undefined;
      room.spyGuessResult = undefined;
      room.winnerTeam = undefined;
      room.gameOverReason = undefined;

      for (const p of room.players.values()) {
        p.readyForNext = false;
        p.readyToVote = false;
        p.votedFor = undefined;
      }

      room.chatMessages.push({
        id: 'sys_' + Date.now(),
        senderId: 'SYSTEM',
        senderName: room.language === 'en' ? 'System' : 'النظام',
        text: t('sysReturnedToLobby', room.language),
        timestamp: Date.now(),
        type: 'system',
      });

      broadcastRoomUpdate(io, room);
    });

    // 11. Chat & Reactions
    socket.on("send_chat", ({ text, type }) => {
      if (!currentRoomCode) return;
      const room = rooms.get(currentRoomCode);
      if (!room) return;

      const player = room.players.get(socket.id);
      if (!player) return;

      const msg = {
        id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        senderId: player.id,
        senderName: player.name,
        text: text.trim(),
        timestamp: Date.now(),
        type: type || 'chat',
      };

      room.chatMessages.push(msg);
      broadcastRoomUpdate(io, room);
    });

    // 12. Kick Player (Host Only)
    socket.on("kick_player", ({ playerIdToKick }) => {
      if (!currentRoomCode) return;
      const room = rooms.get(currentRoomCode);
      if (!room) return;

      const hostPlayer = room.players.get(socket.id);
      if (!hostPlayer || !hostPlayer.isHost) return;

      const playerToKick = room.players.get(playerIdToKick);
      if (playerToKick) {
        room.players.delete(playerIdToKick);
        if (playerToKick.socketId) {
          io.to(playerToKick.socketId).emit("kicked");
        }
        broadcastRoomUpdate(io, room);
      }
    });

    // Disconnect handling
    socket.on("disconnect", () => {
      if (currentRoomCode && currentPlayerId) {
        const room = rooms.get(currentRoomCode);
        if (room) {
          const player = room.players.get(currentPlayerId);
          if (player) {
            player.isOnline = false;

            // If host disconnected, reassign host if possible
            if (player.isHost) {
              const nextHost = Array.from(room.players.values()).find(p => p.isOnline && p.id !== currentPlayerId);
              if (nextHost) {
                player.isHost = false;
                nextHost.isHost = true;
                room.hostId = nextHost.id;
              }
            }

            broadcastRoomUpdate(io, room);

            // Clean empty rooms after 15 minutes of inactivity
            setTimeout(() => {
              const r = rooms.get(currentRoomCode!);
              if (r) {
                const anyOnline = Array.from(r.players.values()).some(p => p.isOnline);
                if (!anyOnline) {
                  rooms.delete(currentRoomCode!);
                }
              }
            }, 15 * 60 * 1000);
          }
        }
      }
    });
  });

  // Serve Vite in dev or Static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`🎮 Server running on http://localhost:${PORT}`);
  });
}

startServer();
