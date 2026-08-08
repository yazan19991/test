import cors from "cors";
import express from "express";
import fs from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Server } from "socket.io";

const PORT = process.env.PORT || 3001;
const MIN_PLAYERS = 3;
const QUESTIONING_SECONDS = 7 * 60;

const LANGUAGES = {
  en: {
    id: "en",
    name: "English",
    nativeName: "English",
    direction: "ltr",
  },
  ar: {
    id: "ar",
    name: "Arabic",
    nativeName: "العربية",
    direction: "rtl",
  },
};

const WORD_PACKS = {
  objects: {
    name: {
      en: "Objects",
      ar: "أشياء",
    },
    words: {
      en: [
        "Backpack",
        "Mirror",
        "Candle",
        "Key",
        "Clock",
        "Umbrella",
        "Notebook",
        "Bottle",
        "Headphones",
        "Wallet",
        "Chair",
        "Lamp",
        "Remote",
        "Camera",
        "Blanket",
      ],
      ar: ["حقيبة", "مرآة", "شمعة", "مفتاح", "ساعة", "مظلة", "دفتر", "زجاجة", "سماعات", "محفظة", "كرسي", "مصباح", "ريموت", "كاميرا", "بطانية"],
    },
  },
  animal: {
    name: {
      en: "Animal",
      ar: "حيوانات",
    },
    words: {
      en: [
        "Lion",
        "Tiger",
        "Elephant",
        "Giraffe",
        "Penguin",
        "Dolphin",
        "Eagle",
        "Wolf",
        "Panda",
        "Kangaroo",
        "Crocodile",
        "Horse",
        "Rabbit",
        "Shark",
        "Camel",
      ],
      ar: ["أسد", "نمر", "فيل", "زرافة", "بطريق", "دلفين", "نسر", "ذئب", "باندا", "كنغر", "تمساح", "حصان", "أرنب", "قرش", "جمل"],
    },
  },
  leagueChamps: {
    name: {
      en: "League of Legends Champs",
      ar: "أبطال ليغ أوف ليجندز",
    },
    words: {
      en: [
        "Ahri",
        "Yasuo",
        "Lux",
        "Jinx",
        "Lee Sin",
        "Garen",
        "Darius",
        "Akali",
        "Ezreal",
        "Thresh",
        "Zed",
        "Caitlyn",
        "Teemo",
        "Vayne",
        "Katarina",
      ],
      ar: ["أهري", "ياسو", "لوكس", "جينكس", "لي سين", "غارين", "داريوس", "أكالي", "إزريال", "ثرش", "زيد", "كايتلن", "تيمو", "فاين", "كاتارينا"],
    },
  },
  games: {
    name: {
      en: "Games",
      ar: "ألعاب",
    },
    words: {
      en: [
        "Minecraft",
        "Fortnite",
        "Valorant",
        "FIFA",
        "Rocket League",
        "Among Us",
        "Call of Duty",
        "Overwatch",
        "Apex Legends",
        "Roblox",
        "GTA",
        "Elden Ring",
        "The Sims",
        "Zelda",
        "Counter-Strike",
      ],
      ar: ["ماينكرافت", "فورتنايت", "فالورانت", "فيفا", "روكيت ليغ", "أمونغ أس", "كول أوف ديوتي", "أوفر واتش", "أبيكس ليجندز", "روبلوكس", "جي تي إيه", "إلدن رينغ", "ذا سيمز", "زيلدا", "كاونتر سترايك"],
    },
  },
  general: {
    name: {
      en: "General",
      ar: "عام",
    },
    words: {
      en: [
        "School",
        "Holiday",
        "Internet",
        "Birthday",
        "Shopping",
        "Weather",
        "Movie",
        "Book",
        "Restaurant",
        "Family",
        "Work",
        "Travel",
        "Coffee",
        "Homework",
        "Weekend",
      ],
      ar: ["مدرسة", "عطلة", "إنترنت", "عيد ميلاد", "تسوق", "طقس", "فيلم", "كتاب", "مطعم", "عائلة", "عمل", "سفر", "قهوة", "واجب", "نهاية الأسبوع"],
    },
  },
  transportation: {
    name: {
      en: "Transportation",
      ar: "مواصلات",
    },
    words: {
      en: [
        "Car",
        "Plane",
        "Bus",
        "Train",
        "Bicycle",
        "Motorcycle",
        "Taxi",
        "Subway",
        "Helicopter",
        "Boat",
        "Truck",
        "Scooter",
        "Tram",
        "Ambulance",
        "Ferry",
      ],
      ar: ["سيارة", "طائرة", "حافلة", "قطار", "دراجة", "دراجة نارية", "تاكسي", "مترو", "هليكوبتر", "قارب", "شاحنة", "سكوتر", "ترام", "إسعاف", "عبّارة"],
    },
  },
  celebrities: {
    name: {
      en: "Celebrities",
      ar: "مشاهير",
    },
    words: {
      en: [
        "Taylor Swift",
        "Cristiano Ronaldo",
        "Lionel Messi",
        "Beyonce",
        "Dwayne Johnson",
        "Ariana Grande",
        "Drake",
        "Selena Gomez",
        "Tom Cruise",
        "Zendaya",
        "Billie Eilish",
        "MrBeast",
        "Rihanna",
        "Emma Watson",
        "Keanu Reeves",
      ],
      ar: ["تايلور سويفت", "كريستيانو رونالدو", "ليونيل ميسي", "بيونسيه", "دوين جونسون", "أريانا غراندي", "دريك", "سيلينا غوميز", "توم كروز", "زيندايا", "بيلي آيليش", "مستر بيست", "ريهانا", "إيما واتسون", "كيانو ريفز"],
    },
  },
  foods: {
    name: {
      en: "Foods",
      ar: "أكلات",
    },
    words: {
      en: [
        "Pizza",
        "Sushi",
        "Burger",
        "Falafel",
        "Tacos",
        "Pasta",
        "Ramen",
        "Shawarma",
        "Pancakes",
        "Kebab",
        "Lasagna",
        "Donuts",
      ],
      ar: ["بيتزا", "سوشي", "برجر", "فلافل", "تاكو", "مكرونة", "رامن", "شاورما", "بان كيك", "كباب", "لازانيا", "دونات"],
    },
  },
  countries: {
    name: {
      en: "Countries",
      ar: "دول",
    },
    words: {
      en: [
        "Japan",
        "Brazil",
        "Egypt",
        "France",
        "Morocco",
        "Canada",
        "Spain",
        "Turkey",
        "Mexico",
        "Italy",
        "India",
        "Norway",
        "Germany",
        "Australia",
        "South Korea",
      ],
      ar: ["اليابان", "البرازيل", "مصر", "فرنسا", "المغرب", "كندا", "إسبانيا", "تركيا", "المكسيك", "إيطاليا", "الهند", "النرويج", "ألمانيا", "أستراليا", "كوريا الجنوبية"],
    },
  },
  music: {
    name: {
      en: "Music",
      ar: "موسيقى",
    },
    words: {
      en: [
        "Guitar",
        "Piano",
        "Drums",
        "Violin",
        "Microphone",
        "Concert",
        "Album",
        "Playlist",
        "Rap",
        "Rock",
        "Pop",
        "Jazz",
        "DJ",
        "Choir",
        "Headphones",
      ],
      ar: ["غيتار", "بيانو", "طبول", "كمان", "ميكروفون", "حفلة موسيقية", "ألبوم", "قائمة تشغيل", "راب", "روك", "بوب", "جاز", "دي جي", "كورال", "سماعات"],
    },
  },
  pcComponents: {
    name: {
      en: "PC Components",
      ar: "قطع الكمبيوتر",
    },
    words: {
      en: [
        "CPU",
        "GPU",
        "Motherboard",
        "RAM",
        "SSD",
        "Hard Drive",
        "Power Supply",
        "Cooling Fan",
        "Case",
        "Monitor",
        "Keyboard",
        "Mouse",
        "Router",
        "Sound Card",
        "Thermal Paste",
      ],
      ar: ["معالج", "كرت شاشة", "لوحة أم", "رام", "إس إس دي", "قرص صلب", "مزود طاقة", "مروحة تبريد", "كيس", "شاشة", "كيبورد", "ماوس", "راوتر", "كرت صوت", "معجون حراري"],
    },
  },
  tvShows: {
    name: {
      en: "TV Shows",
      ar: "مسلسلات",
    },
    words: {
      en: [
        "Friends",
        "Breaking Bad",
        "Stranger Things",
        "The Office",
        "Game of Thrones",
        "Lost",
        "Sherlock",
        "The Simpsons",
        "Dark",
        "Wednesday",
        "House",
        "The Crown",
      ],
      ar: ["فريندز", "بريكنغ باد", "سترينجر ثينغز", "ذا أوفيس", "صراع العروش", "لوست", "شيرلوك", "ذا سيمبسونز", "دارك", "وينزداي", "هاوس", "ذا كراون"],
    },
  },
  sports: {
    name: {
      en: "Sports",
      ar: "رياضات",
    },
    words: {
      en: [
        "Football",
        "Basketball",
        "Tennis",
        "Formula 1",
        "Boxing",
        "Volleyball",
        "Swimming",
        "Baseball",
        "Cricket",
        "Golf",
        "Cycling",
        "Table Tennis",
      ],
      ar: ["كرة القدم", "كرة السلة", "تنس", "فورمولا 1", "ملاكمة", "كرة الطائرة", "سباحة", "بيسبول", "كريكيت", "جولف", "دراجات", "تنس الطاولة"],
    },
  },
  places: {
    name: {
      en: "Places",
      ar: "أماكن",
    },
    words: {
      en: [
        "Airport",
        "Library",
        "Hospital",
        "Cinema",
        "Museum",
        "Beach",
        "Stadium",
        "School",
        "Restaurant",
        "Mall",
        "Hotel",
        "Park",
      ],
      ar: ["مطار", "مكتبة", "مستشفى", "سينما", "متحف", "شاطئ", "ملعب", "مدرسة", "مطعم", "مول", "فندق", "حديقة"],
    },
  },
};

const rooms = new Map();

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, rooms: rooms.size });
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, "dist");
const indexPath = path.join(distPath, "index.html");
app.use(express.static(distPath));
app.get("*", (_req, res, next) => {
  if (!process.env.SERVE_STATIC) {
    next();
    return;
  }

  if (!fs.existsSync(indexPath)) {
    res.status(500).send("Frontend build is missing. Run `npm run build` before starting the server.");
    return;
  }

  res.sendFile(indexPath);
});

function publicLanguages() {
  return Object.values(LANGUAGES);
}

function normalizeLanguage(language) {
  return LANGUAGES[language] ? language : "en";
}

function localizedValue(value, language) {
  return value[language] ?? value.en;
}

function packWords(pack, language) {
  return localizedValue(pack.words, normalizeLanguage(language));
}

function publicPacks(language = "en") {
  const normalizedLanguage = normalizeLanguage(language);

  return Object.entries(WORD_PACKS).map(([id, pack]) => ({
    id,
    name: localizedValue(pack.name, normalizedLanguage),
    count: packWords(pack, normalizedLanguage).length,
  }));
}

function sanitizeName(name, language = "en") {
  const clean = String(name ?? "").trim().replace(/\s+/g, " ").slice(0, 24);
  return clean || (normalizeLanguage(language) === "ar" ? "لاعب" : "Player");
}

function normalizeRoomCode(roomCode) {
  return String(roomCode ?? "").trim().toUpperCase();
}

function generateRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";

  do {
    code = Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  } while (rooms.has(code));

  return code;
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function ok(ack, payload = {}) {
  if (typeof ack === "function") {
    ack({ ok: true, ...payload });
  }
}

function fail(ack, message) {
  if (typeof ack === "function") {
    ack({ ok: false, message });
  }
}

function findRoomByPlayer(playerId) {
  for (const room of rooms.values()) {
    if (room.players.has(playerId)) {
      return room;
    }
  }

  return null;
}

function getPlayerRoom(socket, roomCode) {
  const normalizedCode = normalizeRoomCode(roomCode);
  const room = normalizedCode ? rooms.get(normalizedCode) : findRoomByPlayer(socket.id);

  if (!room || !room.players.has(socket.id)) {
    return null;
  }

  return room;
}

function playerSnapshot(room, playerId) {
  const player = room.players.get(playerId);
  return {
    id: playerId,
    name:
      player?.name ??
      room.knownNames.get(playerId) ??
      (normalizeLanguage(room.language) === "ar" ? "لاعب غير معروف" : "Unknown Player"),
  };
}

function visiblePlayers(room) {
  return [...room.players.values()].map((player) => ({
    id: player.id,
    name: player.name,
    isHost: player.id === room.hostId,
  }));
}

function readyRequired(room) {
  return Math.floor(room.players.size / 2) + 1;
}

function clearQuestionTimer(room) {
  if (room.questionTimer) {
    clearTimeout(room.questionTimer);
    room.questionTimer = null;
  }
}

function eligibleNextTargets(room) {
  if (!room.questionTurn?.answererId) {
    return [];
  }

  const chooserId = room.questionTurn.answererId;
  const previousAskerId = room.questionTurn.askerId;
  const baseCandidates = [...room.players.keys()].filter((playerId) => playerId !== chooserId && playerId !== previousAskerId);
  const unaskedCandidates = baseCandidates.filter((playerId) => !room.questionAskedAnswerers.has(playerId));

  return unaskedCandidates.length > 0 ? unaskedCandidates : baseCandidates;
}

function createInitialQuestionTurn(room) {
  const [askerId, answererId] = shuffle([...room.players.keys()]).slice(0, 2);

  room.questionTurn = {
    askerId,
    answererId,
    turnNumber: 1,
    answerConfirmed: false,
  };
  room.questionAskedAnswerers = new Set([answererId]);
}

function repairQuestionTurn(room) {
  if (room.phase !== "questioning" || room.players.size < 2) {
    return;
  }

  const currentAskerIsHere = room.players.has(room.questionTurn?.askerId);
  const currentAnswererIsHere = room.players.has(room.questionTurn?.answererId);

  if (currentAskerIsHere && currentAnswererIsHere) {
    return;
  }

  createInitialQuestionTurn(room);
}

function scheduleQuestionTimer(room) {
  clearQuestionTimer(room);
  const remainingMs = Math.max(0, room.questionEndsAt - Date.now());

  room.questionTimer = setTimeout(() => {
    if (rooms.get(room.code)?.phase === "questioning") {
      startVoting(room);
    }
  }, remainingMs);
}

function voteSummary(room) {
  const counts = new Map();

  for (const candidateId of room.votes.values()) {
    counts.set(candidateId, (counts.get(candidateId) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([playerId, count]) => ({
      ...playerSnapshot(room, playerId),
      count,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function buildState(room, playerId) {
  const pack = WORD_PACKS[room.packId] ?? null;
  const language = normalizeLanguage(room.language);
  const state = {
    roomCode: room.code,
    playerId,
    phase: room.phase,
    phaseStartedAt: room.phaseStartedAt,
    serverTime: Date.now(),
    hostId: room.hostId,
    isHost: playerId === room.hostId,
    language,
    languageName: LANGUAGES[language].nativeName,
    direction: LANGUAGES[language].direction,
    languages: publicLanguages(),
    packId: room.packId,
    packName: pack ? localizedValue(pack.name, language) : null,
    minPlayers: MIN_PLAYERS,
    playerCount: room.players.size,
    players: visiblePlayers(room),
    packs: publicPacks(language),
  };

  if (room.phase === "role") {
    const isSpy = playerId === room.spyId;
    state.role = {
      kind: isSpy ? "spy" : "inside",
      word: isSpy ? null : room.targetWord,
      acknowledged: room.seenRole.has(playerId),
      acknowledgedCount: room.seenRole.size,
      totalPlayers: room.players.size,
    };
  }

  if (room.phase === "questioning") {
    const answerConfirmed = Boolean(room.questionTurn?.answerConfirmed);
    const eligibleTargetIds = answerConfirmed ? eligibleNextTargets(room) : [];
    state.questioning = {
      readyToVoteIds: [...room.readyToVote],
      readyToVoteCount: room.readyToVote.size,
      readyRequired: readyRequired(room),
      hasReady: room.readyToVote.has(playerId),
      durationSeconds: QUESTIONING_SECONDS,
      endsAt: room.questionEndsAt,
      currentAsker: room.questionTurn?.askerId ? playerSnapshot(room, room.questionTurn.askerId) : null,
      currentAnswerer: room.questionTurn?.answererId ? playerSnapshot(room, room.questionTurn.answererId) : null,
      turnNumber: room.questionTurn?.turnNumber ?? 0,
      answerConfirmed,
      askedAnswererIds: [...room.questionAskedAnswerers],
      eligibleTargetIds,
      canConfirmAnswer: room.questionTurn?.askerId === playerId && !answerConfirmed,
      canChooseNext: room.questionTurn?.answererId === playerId && answerConfirmed,
    };
  }

  if (room.phase === "voting") {
    state.voting = {
      votesCast: room.votes.size,
      totalVotes: room.players.size,
      votedFor: room.votes.get(playerId) ?? null,
    };
  }

  if (room.phase === "spyGuess") {
    const isSpy = playerId === room.spyId;
    state.spyGuess = {
      isSpy,
      options: isSpy ? room.guessOptions : [],
    };
  }

  if (room.phase === "reveal") {
    state.result = room.result;
  }

  return state;
}

function emitRoomState(room) {
  for (const playerId of room.players.keys()) {
    io.to(playerId).emit("roomState", buildState(room, playerId));
  }
}

function resetRoundState(room) {
  clearQuestionTimer(room);
  room.targetWord = null;
  room.spyId = null;
  room.seenRole.clear();
  room.readyToVote.clear();
  room.votes.clear();
  room.questionTurn = null;
  room.questionAskedAnswerers = new Set();
  room.questionEndsAt = null;
  room.guessOptions = [];
  room.result = null;
  room.phaseStartedAt = Date.now();
}

function startQuestioning(room) {
  room.phase = "questioning";
  room.phaseStartedAt = Date.now();
  room.questionEndsAt = room.phaseStartedAt + QUESTIONING_SECONDS * 1000;
  room.readyToVote.clear();
  createInitialQuestionTurn(room);
  scheduleQuestionTimer(room);
  emitRoomState(room);
}

function startVoting(room) {
  clearQuestionTimer(room);
  room.phase = "voting";
  room.phaseStartedAt = Date.now();
  room.votes.clear();
  emitRoomState(room);
}

function createGuessOptions(room) {
  const pack = WORD_PACKS[room.packId];
  const words = packWords(pack, room.language);
  const distractors = shuffle(words.filter((word) => word !== room.targetWord)).slice(0, 3);
  return shuffle([room.targetWord, ...distractors]);
}

function endRound(room, result) {
  clearQuestionTimer(room);
  room.phase = "reveal";
  room.phaseStartedAt = Date.now();
  room.result = {
    ...result,
    targetWord: room.targetWord,
    spy: playerSnapshot(room, room.spyId),
    votes: voteSummary(room),
  };
  emitRoomState(room);
}

function resolveVoting(room) {
  const counts = new Map();

  for (const candidateId of room.votes.values()) {
    counts.set(candidateId, (counts.get(candidateId) ?? 0) + 1);
  }

  const maxVotes = Math.max(...counts.values());
  const topCandidates = [...counts.entries()].filter(([, count]) => count === maxVotes).map(([id]) => id);

  if (topCandidates.length !== 1) {
    endRound(room, {
      winner: "spy",
      title: "Spy Wins",
      message: "The vote tied, so the spy escaped.",
      outcome: "tie",
    });
    return;
  }

  const suspectedId = topCandidates[0];

  if (suspectedId !== room.spyId) {
    endRound(room, {
      winner: "spy",
      title: "Spy Wins",
      message: `${playerSnapshot(room, suspectedId).name} was inside the story.`,
      outcome: "wrongVote",
      votedPlayer: playerSnapshot(room, suspectedId),
    });
    return;
  }

  room.phase = "spyGuess";
  room.phaseStartedAt = Date.now();
  room.guessOptions = createGuessOptions(room);
  emitRoomState(room);
}

function removePlayer(playerId) {
  const room = findRoomByPlayer(playerId);

  if (!room) {
    return;
  }

  const removedWasSpy = room.spyId === playerId;
  io.sockets.sockets.get(playerId)?.leave(room.code);
  room.players.delete(playerId);
  room.seenRole.delete(playerId);
  room.readyToVote.delete(playerId);
  room.questionAskedAnswerers.delete(playerId);
  room.votes.delete(playerId);

  for (const [voterId, candidateId] of room.votes.entries()) {
    if (candidateId === playerId) {
      room.votes.delete(voterId);
    }
  }

  if (room.players.size === 0) {
    rooms.delete(room.code);
    return;
  }

  if (room.hostId === playerId) {
    room.hostId = room.players.keys().next().value;
  }

  if (!["lobby", "reveal"].includes(room.phase) && removedWasSpy) {
    endRound(room, {
      winner: "inside",
      title: "Story Team Wins",
      message: "The spy left the room.",
      outcome: "spyLeft",
    });
    return;
  }

  if (room.phase === "role" && room.seenRole.size >= room.players.size) {
    startQuestioning(room);
    return;
  }

  if (room.phase === "questioning" && room.readyToVote.size > room.players.size / 2) {
    startVoting(room);
    return;
  }

  if (room.phase === "questioning") {
    repairQuestionTurn(room);
  }

  if (room.phase === "voting" && room.votes.size >= room.players.size) {
    resolveVoting(room);
    return;
  }

  emitRoomState(room);
}

io.on("connection", (socket) => {
  socket.emit("languages", publicLanguages());
  socket.emit("packs", publicPacks());

  socket.on("createRoom", ({ playerName, language } = {}, ack) => {
    removePlayer(socket.id);

    const code = generateRoomCode();
    const roomLanguage = normalizeLanguage(language);
    const name = sanitizeName(playerName, roomLanguage);
    const room = {
      code,
      hostId: socket.id,
      players: new Map([[socket.id, { id: socket.id, name }]]),
      knownNames: new Map([[socket.id, name]]),
      language: roomLanguage,
      packId: "foods",
      phase: "lobby",
      phaseStartedAt: Date.now(),
      targetWord: null,
      spyId: null,
      seenRole: new Set(),
      readyToVote: new Set(),
      votes: new Map(),
      questionTurn: null,
      questionAskedAnswerers: new Set(),
      questionEndsAt: null,
      questionTimer: null,
      guessOptions: [],
      result: null,
    };

    rooms.set(code, room);
    socket.join(code);
    ok(ack, { roomCode: code, playerId: socket.id });
    emitRoomState(room);
  });

  socket.on("joinRoom", ({ roomCode, playerName } = {}, ack) => {
    const code = normalizeRoomCode(roomCode);
    const room = rooms.get(code);
    const currentRoom = findRoomByPlayer(socket.id);

    if (!room) {
      fail(ack, "Room not found.");
      return;
    }

    if (room.phase !== "lobby") {
      fail(ack, "This room has already started a round.");
      return;
    }

    if (currentRoom?.code === code) {
      const name = sanitizeName(playerName, room.language);
      room.players.set(socket.id, { id: socket.id, name });
      room.knownNames.set(socket.id, name);
      ok(ack, { roomCode: code, playerId: socket.id });
      emitRoomState(room);
      return;
    }

    removePlayer(socket.id);

    const name = sanitizeName(playerName, room.language);
    room.players.set(socket.id, { id: socket.id, name });
    room.knownNames.set(socket.id, name);
    socket.join(code);

    ok(ack, { roomCode: code, playerId: socket.id });
    emitRoomState(room);
  });

  socket.on("setLanguage", ({ roomCode, language } = {}, ack) => {
    const room = getPlayerRoom(socket, roomCode);

    if (!room) {
      fail(ack, "You are not in that room.");
      return;
    }

    if (socket.id !== room.hostId) {
      fail(ack, "Only the host can change the game language.");
      return;
    }

    if (room.phase !== "lobby") {
      fail(ack, "The language can only be changed in the lobby.");
      return;
    }

    room.language = normalizeLanguage(language);
    ok(ack);
    emitRoomState(room);
  });

  socket.on("setPack", ({ roomCode, packId } = {}, ack) => {
    const room = getPlayerRoom(socket, roomCode);

    if (!room) {
      fail(ack, "You are not in that room.");
      return;
    }

    if (socket.id !== room.hostId) {
      fail(ack, "Only the host can change the word pack.");
      return;
    }

    if (room.phase !== "lobby") {
      fail(ack, "The word pack can only be changed in the lobby.");
      return;
    }

    if (!WORD_PACKS[packId]) {
      fail(ack, "Unknown word pack.");
      return;
    }

    room.packId = packId;
    ok(ack);
    emitRoomState(room);
  });

  socket.on("startGame", ({ roomCode } = {}, ack) => {
    const room = getPlayerRoom(socket, roomCode);

    if (!room) {
      fail(ack, "You are not in that room.");
      return;
    }

    if (socket.id !== room.hostId) {
      fail(ack, "Only the host can start the game.");
      return;
    }

    if (room.players.size < MIN_PLAYERS) {
      fail(ack, `At least ${MIN_PLAYERS} players are required.`);
      return;
    }

    const pack = WORD_PACKS[room.packId];
    const words = packWords(pack, room.language);
    const playerIds = [...room.players.keys()];

    resetRoundState(room);
    room.phase = "role";
    room.targetWord = pickRandom(words);
    room.spyId = pickRandom(playerIds);

    ok(ack);
    emitRoomState(room);
  });

  socket.on("ackRole", ({ roomCode } = {}, ack) => {
    const room = getPlayerRoom(socket, roomCode);

    if (!room) {
      fail(ack, "You are not in that room.");
      return;
    }

    if (room.phase !== "role") {
      fail(ack, "Role confirmation is not active.");
      return;
    }

    room.seenRole.add(socket.id);
    ok(ack);

    if (room.seenRole.size >= room.players.size) {
      startQuestioning(room);
      return;
    }

    emitRoomState(room);
  });

  socket.on("readyToVote", ({ roomCode } = {}, ack) => {
    const room = getPlayerRoom(socket, roomCode);

    if (!room) {
      fail(ack, "You are not in that room.");
      return;
    }

    if (room.phase !== "questioning") {
      fail(ack, "Voting is not open yet.");
      return;
    }

    room.readyToVote.add(socket.id);
    ok(ack);

    if (room.readyToVote.size > room.players.size / 2) {
      startVoting(room);
      return;
    }

    emitRoomState(room);
  });

  socket.on("confirmQuestionAnswer", ({ roomCode } = {}, ack) => {
    const room = getPlayerRoom(socket, roomCode);

    if (!room) {
      fail(ack, "You are not in that room.");
      return;
    }

    if (room.phase !== "questioning") {
      fail(ack, "Question turns are only active during questioning.");
      return;
    }

    if (socket.id !== room.questionTurn?.askerId) {
      fail(ack, "Only the current asker can confirm the answer.");
      return;
    }

    if (room.questionTurn.answerConfirmed) {
      fail(ack, "That answer is already confirmed.");
      return;
    }

    room.questionTurn.answerConfirmed = true;
    ok(ack);
    emitRoomState(room);
  });

  socket.on("chooseNextQuestionTarget", ({ roomCode, targetId } = {}, ack) => {
    const room = getPlayerRoom(socket, roomCode);

    if (!room) {
      fail(ack, "You are not in that room.");
      return;
    }

    if (room.phase !== "questioning") {
      fail(ack, "Question turns are only active during questioning.");
      return;
    }

    if (socket.id !== room.questionTurn?.answererId) {
      fail(ack, "Only the player who just answered can choose the next target.");
      return;
    }

    if (!room.questionTurn.answerConfirmed) {
      fail(ack, "Wait for the asker to confirm that you answered.");
      return;
    }

    const eligibleTargetIds = eligibleNextTargets(room);

    if (!eligibleTargetIds.includes(targetId)) {
      fail(ack, "Choose an eligible player.");
      return;
    }

    room.questionTurn = {
      askerId: socket.id,
      answererId: targetId,
      turnNumber: (room.questionTurn?.turnNumber ?? 0) + 1,
      answerConfirmed: false,
    };
    room.questionAskedAnswerers.add(targetId);

    ok(ack);
    emitRoomState(room);
  });

  socket.on("castVote", ({ roomCode, targetId } = {}, ack) => {
    const room = getPlayerRoom(socket, roomCode);

    if (!room) {
      fail(ack, "You are not in that room.");
      return;
    }

    if (room.phase !== "voting") {
      fail(ack, "Voting is not active.");
      return;
    }

    if (room.votes.has(socket.id)) {
      fail(ack, "Your vote is already locked.");
      return;
    }

    if (!room.players.has(targetId)) {
      fail(ack, "That player is not in the room.");
      return;
    }

    if (targetId === socket.id) {
      fail(ack, "Vote for another player.");
      return;
    }

    room.votes.set(socket.id, targetId);
    ok(ack);

    if (room.votes.size >= room.players.size) {
      resolveVoting(room);
      return;
    }

    emitRoomState(room);
  });

  socket.on("submitSpyGuess", ({ roomCode, word } = {}, ack) => {
    const room = getPlayerRoom(socket, roomCode);

    if (!room) {
      fail(ack, "You are not in that room.");
      return;
    }

    if (room.phase !== "spyGuess") {
      fail(ack, "The spy guess is not active.");
      return;
    }

    if (socket.id !== room.spyId) {
      fail(ack, "Only the spy can guess the word.");
      return;
    }

    if (!room.guessOptions.includes(word)) {
      fail(ack, "Choose one of the shown words.");
      return;
    }

    const isCorrect = word === room.targetWord;
    ok(ack);
    endRound(room, {
      winner: isCorrect ? "spy" : "inside",
      title: isCorrect ? "Spy Wins" : "Story Team Wins",
      message: isCorrect ? "The spy guessed the secret word." : "The spy missed the secret word.",
      outcome: isCorrect ? "correctGuess" : "wrongGuess",
      guess: word,
    });
  });

  socket.on("playAgain", ({ roomCode } = {}, ack) => {
    const room = getPlayerRoom(socket, roomCode);

    if (!room) {
      fail(ack, "You are not in that room.");
      return;
    }

    if (socket.id !== room.hostId) {
      fail(ack, "Only the host can return everyone to the lobby.");
      return;
    }

    resetRoundState(room);
    room.phase = "lobby";
    ok(ack);
    emitRoomState(room);
  });

  socket.on("disconnect", () => {
    removePlayer(socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Socket server listening on http://localhost:${PORT}`);
});
