import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import {
  Check,
  CircleDot,
  Copy,
  Crown,
  DoorOpen,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Play,
  RefreshCw,
  Timer,
  Users,
  Vote,
} from "lucide-react";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

const LANGUAGE_OPTIONS = [
  { id: "en", nativeName: "English", direction: "ltr" },
  { id: "ar", nativeName: "العربية", direction: "rtl" },
];

const UI = {
  en: {
    appEyebrow: "Real-time party game",
    appTitle: "Outside the Story",
    tableEyebrow: "One secret word",
    tableTitle: "Everyone knows it, except one player.",
    online: "Online",
    offline: "Offline",
    copyRoomCode: "Copy room code",
    lobby: "Lobby",
    entryTitle: "Create a room or join your friends.",
    playerName: "Player name",
    playerPlaceholder: "Maya",
    gameLanguage: "Game language",
    createRoom: "Create Room",
    join: "Join",
    roomCodePlaceholder: "ABCD",
    lobbyTitle: "Players are gathering.",
    wordPack: "Word pack",
    roomCode: "Room code",
    players: "Players",
    startGame: (count, min) => `Start Game (${count}/${min})`,
    waitingForHost: "Waiting for Host",
    secretRole: "Secret role",
    roleSpyTitle: "You are outside the story.",
    roleInsideTitle: "You are inside the story.",
    spy: "Spy",
    secretWord: "Secret word",
    youAreSpy: "You are the spy",
    playersReady: (ready, total) => `${ready}/${total} players ready`,
    confirmed: "Confirmed",
    iUnderstand: "I Understand",
    questioning: "Questioning",
    questioningTitle: "Find the player who is bluffing.",
    readyToVote: "Ready to vote",
    readyToVoteButton: "Ready to Vote 🗳️",
    voteReadinessLocked: "Vote Readiness Locked",
    voting: "Voting",
    votingTitle: "Choose the suspected spy.",
    votesLocked: (cast, total) => `Votes locked: ${cast}/${total}`,
    finalGuess: "Final guess",
    waitingSpyGuessTitle: "The spy is choosing the word.",
    pickSecretWord: "Pick the secret word.",
    reveal: "Reveal",
    spyWins: "Spy Wins",
    storyTeamWins: "Story Team Wins",
    resultTie: "The vote tied, so the spy escaped.",
    resultWrongVote: (name) => `${name} was inside the story.`,
    resultSpyLeft: "The spy left the room.",
    resultCorrectGuess: "The spy guessed the secret word.",
    resultWrongGuess: "The spy missed the secret word.",
    finalVotes: "Final votes",
    votedOut: "Voted out",
    spyGuess: "Spy guess",
    backToLobby: "Back to Lobby",
    actionFailed: "Action failed.",
  },
  ar: {
    appEyebrow: "لعبة جماعية فورية",
    appTitle: "برا السالفة",
    tableEyebrow: "كلمة سرية واحدة",
    tableTitle: "الكل يعرفها، ما عدا لاعب واحد.",
    online: "متصل",
    offline: "غير متصل",
    copyRoomCode: "نسخ كود الغرفة",
    lobby: "اللوبي",
    entryTitle: "أنشئ غرفة أو انضم لأصدقائك.",
    playerName: "اسم اللاعب",
    playerPlaceholder: "مايا",
    gameLanguage: "لغة اللعبة",
    createRoom: "إنشاء غرفة",
    join: "انضمام",
    roomCodePlaceholder: "ABCD",
    lobbyTitle: "اللاعبون يتجمعون.",
    wordPack: "باقة الكلمات",
    roomCode: "كود الغرفة",
    players: "اللاعبون",
    startGame: (count, min) => `ابدأ اللعبة (${count}/${min})`,
    waitingForHost: "بانتظار المضيف",
    secretRole: "الدور السري",
    roleSpyTitle: "أنت برا السالفة.",
    roleInsideTitle: "أنت داخل السالفة.",
    spy: "الجاسوس",
    secretWord: "الكلمة السرية",
    youAreSpy: "أنت برا السالفة",
    playersReady: (ready, total) => `${ready}/${total} لاعبين جاهزين`,
    confirmed: "تم التأكيد",
    iUnderstand: "فهمت الدور",
    questioning: "الأسئلة",
    questioningTitle: "اكتشف اللاعب الذي يراوغ.",
    readyToVote: "جاهزون للتصويت",
    readyToVoteButton: "جاهز للتصويت 🗳️",
    voteReadinessLocked: "تم تسجيل جاهزيتك",
    voting: "التصويت",
    votingTitle: "اختر اللاعب المشتبه به.",
    votesLocked: (cast, total) => `الأصوات المؤكدة: ${cast}/${total}`,
    finalGuess: "التخمين الأخير",
    waitingSpyGuessTitle: "الجاسوس يختار الكلمة.",
    pickSecretWord: "اختر الكلمة السرية.",
    reveal: "النتيجة",
    spyWins: "فاز الجاسوس",
    storyTeamWins: "فاز فريق السالفة",
    resultTie: "انتهى التصويت بالتعادل، لذلك هرب الجاسوس.",
    resultWrongVote: (name) => `${name} كان داخل السالفة.`,
    resultSpyLeft: "غادر الجاسوس الغرفة.",
    resultCorrectGuess: "الجاسوس خمّن الكلمة السرية.",
    resultWrongGuess: "الجاسوس أخطأ في تخمين الكلمة.",
    finalVotes: "الأصوات النهائية",
    votedOut: "المصوّت عليه",
    spyGuess: "تخمين الجاسوس",
    backToLobby: "العودة إلى اللوبي",
    actionFailed: "فشل الإجراء.",
  },
};

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

function getUi(language) {
  return UI[language] ?? UI.en;
}

function getDirection(language) {
  return LANGUAGE_OPTIONS.find((option) => option.id === language)?.direction ?? "ltr";
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function useElapsedSeconds(phaseStartedAt) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return Math.max(0, Math.floor((now - (phaseStartedAt ?? now)) / 1000));
}

function App() {
  const socket = useMemo(
    () =>
      io(SOCKET_URL, {
        autoConnect: false,
      }),
    [],
  );
  const [connected, setConnected] = useState(false);
  const [roomState, setRoomState] = useState(null);
  const [preferredLanguage, setPreferredLanguage] = useState(
    () => localStorage.getItem("outsideStoryLanguage") || "en",
  );
  const [error, setError] = useState("");

  const activeLanguage = roomState?.language || preferredLanguage;
  const direction = roomState?.direction || getDirection(activeLanguage);
  const t = getUi(activeLanguage);

  useEffect(() => {
    document.documentElement.lang = activeLanguage;
    document.documentElement.dir = direction;
  }, [activeLanguage, direction]);

  useEffect(() => {
    socket.connect();

    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);
    const handleRoomState = (state) => {
      setError("");
      setRoomState(state);
      setPreferredLanguage(state.language);
      localStorage.setItem("outsideStoryLanguage", state.language);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("roomState", handleRoomState);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("roomState", handleRoomState);
      socket.disconnect();
    };
  }, [socket]);

  const changePreferredLanguage = (language) => {
    setPreferredLanguage(language);
    localStorage.setItem("outsideStoryLanguage", language);
  };

  const send = (event, payload = {}) => {
    setError("");
    socket.emit(event, payload, (response) => {
      if (!response?.ok) {
        setError(response?.message || t.actionFailed);
      }
    });
  };

  return (
    <div dir={direction} lang={activeLanguage} className="min-h-screen overflow-x-hidden text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <Header connected={connected} roomState={roomState} t={t} />
        <main className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[0.9fr_1.1fr]">
          <aside
            className={classNames(
              "flex justify-center",
              activeLanguage === "ar" ? "lg:justify-end" : "lg:justify-start",
            )}
          >
            <GameTableScene t={t} language={activeLanguage} />
          </aside>
          <section className="min-w-0 rounded-[8px] border border-white/10 bg-[#f8faf4] p-4 text-slate-950 shadow-glow sm:p-6">
            {error ? (
              <div className="mb-4 rounded-[8px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {error}
              </div>
            ) : null}
            <StageRouter
              send={send}
              roomState={roomState}
              t={t}
              language={activeLanguage}
              preferredLanguage={preferredLanguage}
              setPreferredLanguage={changePreferredLanguage}
            />
          </section>
        </main>
      </div>
    </div>
  );
}

function Header({ connected, roomState, t }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-teal-200">{t.appEyebrow}</p>
        <h1 className="truncate text-2xl font-black text-white sm:text-3xl">{t.appTitle}</h1>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {roomState?.roomCode ? <RoomCodePill code={roomState.roomCode} t={t} /> : null}
        <span
          className={classNames(
            "inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold",
            connected ? "bg-emerald-400 text-emerald-950" : "bg-rose-400 text-rose-950",
          )}
        >
          <CircleDot className="h-4 w-4" />
          {connected ? t.online : t.offline}
        </span>
      </div>
    </header>
  );
}

function RoomCodePill({ code, t }) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    await navigator.clipboard?.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  return (
    <button
      type="button"
      onClick={copyCode}
      title={t.copyRoomCode}
      className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-3 text-sm font-black text-slate-950 transition hover:bg-teal-100"
    >
      <KeyRound className="h-4 w-4" />
      {code}
      {copied ? <Check className="h-4 w-4 text-emerald-700" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

function GameTableScene({ t, language }) {
  return (
    <div
      className={classNames(
        "flex w-full max-w-sm flex-col items-center gap-5 text-center",
        language === "ar" ? "lg:items-end lg:text-right" : "lg:items-start lg:text-left",
      )}
    >
      <div className="game-table" aria-hidden="true">
        <span className="table-token" />
        <span className="table-token" />
        <span className="table-token" />
        <span className="table-token" />
        <span className="table-token" />
      </div>
      <div className="max-w-xs">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-amber-200">{t.tableEyebrow}</p>
        <p className="mt-2 text-balance text-3xl font-black leading-tight text-white sm:text-4xl">{t.tableTitle}</p>
      </div>
    </div>
  );
}

function StageRouter({ send, roomState, t, language, preferredLanguage, setPreferredLanguage }) {
  if (!roomState) {
    return (
      <EntryLobby
        send={send}
        t={t}
        preferredLanguage={preferredLanguage}
        setPreferredLanguage={setPreferredLanguage}
      />
    );
  }

  switch (roomState.phase) {
    case "lobby":
      return <LobbyRoom send={send} state={roomState} t={t} />;
    case "role":
      return <RoleView send={send} state={roomState} t={t} />;
    case "questioning":
      return <Questioning send={send} state={roomState} t={t} />;
    case "voting":
      return <Voting send={send} state={roomState} t={t} />;
    case "spyGuess":
      return <SpyGuessing send={send} state={roomState} t={t} />;
    case "reveal":
      return <Reveal send={send} state={roomState} t={t} />;
    default:
      return (
        <EntryLobby
          send={send}
          t={t}
          preferredLanguage={language}
          setPreferredLanguage={setPreferredLanguage}
        />
      );
  }
}

function EntryLobby({ send, t, preferredLanguage, setPreferredLanguage }) {
  const [playerName, setPlayerName] = useState(() => localStorage.getItem("outsideStoryName") || "");
  const [roomCode, setRoomCode] = useState("");

  const rememberName = () => {
    localStorage.setItem("outsideStoryName", playerName.trim());
  };

  const createRoom = () => {
    rememberName();
    send("createRoom", { playerName, language: preferredLanguage });
  };

  const joinRoom = () => {
    rememberName();
    send("joinRoom", { playerName, roomCode });
  };

  return (
    <div className="space-y-6">
      <StageHeading eyebrow={t.lobby} title={t.entryTitle} />
      <label className="block">
        <span className="mb-2 block text-sm font-black text-slate-700">{t.playerName}</span>
        <input
          value={playerName}
          onChange={(event) => setPlayerName(event.target.value)}
          maxLength={24}
          placeholder={t.playerPlaceholder}
          className="h-12 w-full rounded-[8px] border border-slate-300 bg-white px-4 text-base font-bold outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
        />
      </label>
      <LanguageSelector
        label={t.gameLanguage}
        value={preferredLanguage}
        onChange={setPreferredLanguage}
        languages={LANGUAGE_OPTIONS}
      />
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <button
          type="button"
          onClick={createRoom}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] bg-teal-700 px-5 text-sm font-black text-white transition hover:bg-teal-800"
        >
          <Play className="h-5 w-5" />
          {t.createRoom}
        </button>
        <div className="grid gap-3 sm:grid-cols-[9rem_auto]">
          <input
            value={roomCode}
            onChange={(event) => setRoomCode(event.target.value.toUpperCase().slice(0, 4))}
            placeholder={t.roomCodePlaceholder}
            className="h-12 rounded-[8px] border border-slate-300 bg-white px-4 text-center text-lg font-black uppercase tracking-[0.22em] outline-none transition focus:border-amber-600 focus:ring-4 focus:ring-amber-100"
          />
          <button
            type="button"
            onClick={joinRoom}
            disabled={roomCode.length !== 4}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <DoorOpen className="h-5 w-5" />
            {t.join}
          </button>
        </div>
      </div>
    </div>
  );
}

function LobbyRoom({ send, state, t }) {
  const canStart = state.isHost && state.playerCount >= state.minPlayers;

  return (
    <div className="space-y-6">
      <StageHeading eyebrow={t.lobby} title={t.lobbyTitle} />
      <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
        <LanguageSelector
          label={t.gameLanguage}
          value={state.language}
          onChange={(language) => send("setLanguage", { roomCode: state.roomCode, language })}
          languages={state.languages}
          disabled={!state.isHost}
        />
        <label className="block">
          <span className="mb-2 block text-sm font-black text-slate-700">{t.wordPack}</span>
          <select
            value={state.packId}
            disabled={!state.isHost}
            onChange={(event) => send("setPack", { roomCode: state.roomCode, packId: event.target.value })}
            className="h-12 w-full rounded-[8px] border border-slate-300 bg-white px-4 text-base font-bold outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            {state.packs.map((pack) => (
              <option key={pack.id} value={pack.id}>
                {pack.name} ({pack.count})
              </option>
            ))}
          </select>
        </label>
        <div className="rounded-[8px] border border-slate-200 bg-slate-50 p-4 md:col-span-2">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{t.roomCode}</p>
          <p className="mt-1 text-3xl font-black tracking-[0.22em] text-slate-950">{state.roomCode}</p>
        </div>
      </div>
      <PlayerList players={state.players} t={t} />
      <button
        type="button"
        onClick={() => send("startGame", { roomCode: state.roomCode })}
        disabled={!canStart}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-rose-600 px-5 text-sm font-black text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        <Play className="h-5 w-5" />
        {state.isHost ? t.startGame(state.playerCount, state.minPlayers) : t.waitingForHost}
      </button>
    </div>
  );
}

function RoleView({ send, state, t }) {
  const isSpy = state.role.kind === "spy";

  return (
    <div className="space-y-6">
      <StageHeading eyebrow={t.secretRole} title={isSpy ? t.roleSpyTitle : t.roleInsideTitle} />
      <div
        className={classNames(
          "rounded-[8px] border p-6 text-center",
          isSpy ? "border-rose-200 bg-rose-50" : "border-teal-200 bg-teal-50",
        )}
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-950 text-white">
          {isSpy ? <EyeOff className="h-8 w-8" /> : <Eye className="h-8 w-8" />}
        </div>
        <p className="mt-5 text-sm font-black uppercase tracking-[0.18em] text-slate-500">
          {isSpy ? t.spy : t.secretWord}
        </p>
        <p className="mt-2 break-words text-4xl font-black text-slate-950 sm:text-5xl">
          {isSpy ? t.youAreSpy : state.role.word}
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-bold text-slate-600">
          {t.playersReady(state.role.acknowledgedCount, state.role.totalPlayers)}
        </p>
        <button
          type="button"
          onClick={() => send("ackRole", { roomCode: state.roomCode })}
          disabled={state.role.acknowledged}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] bg-teal-700 px-5 text-sm font-black text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <Check className="h-5 w-5" />
          {state.role.acknowledged ? t.confirmed : t.iUnderstand}
        </button>
      </div>
    </div>
  );
}

function Questioning({ send, state, t }) {
  const elapsed = useElapsedSeconds(state.phaseStartedAt);
  const readyIds = new Set(state.questioning.readyToVoteIds);
  const readyPercent = Math.min(100, (state.questioning.readyToVoteCount / state.questioning.readyRequired) * 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <StageHeading eyebrow={t.questioning} title={t.questioningTitle} />
        <div className="inline-flex h-14 min-w-[8rem] items-center justify-center gap-2 rounded-[8px] bg-slate-950 px-4 font-black text-white">
          <Timer className="h-5 w-5 text-amber-300" />
          <span className="tabular-nums">{formatTime(elapsed)}</span>
        </div>
      </div>
      <PlayerList players={state.players} readyIds={readyIds} t={t} />
      <div>
        <div className="mb-3 flex items-center justify-between gap-3 text-sm font-black text-slate-700">
          <span>{t.readyToVote}</span>
          <span>
            {state.questioning.readyToVoteCount}/{state.questioning.readyRequired}
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${readyPercent}%` }} />
        </div>
      </div>
      <button
        type="button"
        onClick={() => send("readyToVote", { roomCode: state.roomCode })}
        disabled={state.questioning.hasReady}
        className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-[8px] bg-amber-500 px-5 text-base font-black text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
      >
        <Vote className="h-5 w-5" />
        {state.questioning.hasReady ? t.voteReadinessLocked : t.readyToVoteButton}
      </button>
    </div>
  );
}

function Voting({ send, state, t }) {
  const votedFor = state.voting.votedFor;

  return (
    <div className="space-y-6">
      <StageHeading eyebrow={t.voting} title={t.votingTitle} />
      <div className="grid gap-3 sm:grid-cols-2">
        {state.players.map((player) => {
          const isSelf = player.id === state.playerId;
          const isSelected = votedFor === player.id;

          return (
            <button
              type="button"
              key={player.id}
              disabled={Boolean(votedFor) || isSelf}
              onClick={() => send("castVote", { roomCode: state.roomCode, targetId: player.id })}
              className={classNames(
                "flex min-h-16 items-center justify-between gap-3 rounded-[8px] border px-4 font-black transition",
                isSelected
                  ? "border-teal-600 bg-teal-50 text-teal-950"
                  : "border-slate-200 bg-white text-slate-950 hover:border-rose-300 hover:bg-rose-50",
                (Boolean(votedFor) || isSelf) && !isSelected ? "cursor-not-allowed opacity-55" : "",
              )}
            >
              <span className="min-w-0 truncate">{player.name}</span>
              {isSelected ? <Check className="h-5 w-5 text-teal-700" /> : <Vote className="h-5 w-5 text-slate-400" />}
            </button>
          );
        })}
      </div>
      <div className="rounded-[8px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
        {t.votesLocked(state.voting.votesCast, state.voting.totalVotes)}
      </div>
    </div>
  );
}

function SpyGuessing({ send, state, t }) {
  if (!state.spyGuess.isSpy) {
    return (
      <div className="space-y-6 text-center">
        <StageHeading eyebrow={t.finalGuess} title={t.waitingSpyGuessTitle} centered />
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-950 text-white">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
        <PlayerList players={state.players} t={t} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StageHeading eyebrow={t.finalGuess} title={t.pickSecretWord} />
      <div className="grid gap-3 sm:grid-cols-2">
        {state.spyGuess.options.map((word) => (
          <button
            type="button"
            key={word}
            onClick={() => send("submitSpyGuess", { roomCode: state.roomCode, word })}
            className="min-h-16 rounded-[8px] border border-slate-200 bg-white px-4 text-lg font-black text-slate-950 transition hover:border-teal-300 hover:bg-teal-50"
          >
            {word}
          </button>
        ))}
      </div>
    </div>
  );
}

function Reveal({ send, state, t }) {
  const winnerIsSpy = state.result.winner === "spy";

  return (
    <div className="space-y-6">
      <StageHeading eyebrow={t.reveal} title={winnerIsSpy ? t.spyWins : t.storyTeamWins} />
      <div
        className={classNames(
          "rounded-[8px] border p-5",
          winnerIsSpy ? "border-rose-200 bg-rose-50" : "border-emerald-200 bg-emerald-50",
        )}
      >
        <p className="text-base font-black text-slate-950">{getResultMessage(state.result, t)}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <RevealStat label={t.secretWord} value={state.result.targetWord} />
          <RevealStat label={t.spy} value={state.result.spy.name} />
          {state.result.guess ? <RevealStat label={t.spyGuess} value={state.result.guess} /> : null}
          {state.result.votedPlayer ? <RevealStat label={t.votedOut} value={state.result.votedPlayer.name} /> : null}
        </div>
      </div>
      {state.result.votes?.length ? (
        <div>
          <p className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-slate-500">{t.finalVotes}</p>
          <div className="grid gap-2">
            {state.result.votes.map((vote) => (
              <div
                key={vote.id}
                className="flex min-h-12 items-center justify-between gap-3 rounded-[8px] border border-slate-200 bg-white px-4 text-sm font-black"
              >
                <span className="min-w-0 truncate">{vote.name}</span>
                <span className="rounded-full bg-slate-950 px-3 py-1 text-white">{vote.count}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => send("playAgain", { roomCode: state.roomCode })}
        disabled={!state.isHost}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        <RefreshCw className="h-5 w-5" />
        {state.isHost ? t.backToLobby : t.waitingForHost}
      </button>
    </div>
  );
}

function LanguageSelector({ label, value, onChange, languages, disabled = false }) {
  return (
    <div>
      <span className="mb-2 block text-sm font-black text-slate-700">{label}</span>
      <div className="grid grid-cols-2 gap-2 rounded-[8px] border border-slate-200 bg-slate-100 p-1">
        {languages.map((language) => {
          const isActive = language.id === value;

          return (
            <button
              key={language.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(language.id)}
              className={classNames(
                "h-10 rounded-[6px] px-3 text-sm font-black transition",
                isActive ? "bg-slate-950 text-white shadow-sm" : "bg-transparent text-slate-600 hover:bg-white",
                disabled ? "cursor-not-allowed opacity-70" : "",
              )}
            >
              {language.nativeName}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StageHeading({ eyebrow, title, centered = false }) {
  return (
    <div className={classNames(centered ? "text-center" : "")}>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">{eyebrow}</p>
      <h2 className="mt-1 text-balance text-2xl font-black leading-tight text-slate-950 sm:text-3xl">{title}</h2>
    </div>
  );
}

function PlayerList({ players, t, readyIds = new Set() }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-slate-500">
        <Users className="h-4 w-4" />
        {t.players}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {players.map((player) => (
          <div
            key={player.id}
            className="flex min-h-12 items-center justify-between gap-3 rounded-[8px] border border-slate-200 bg-white px-4 text-sm font-black text-slate-950"
          >
            <span className="min-w-0 truncate">{player.name}</span>
            <span className="flex shrink-0 items-center gap-2">
              {readyIds.has(player.id) ? <Check className="h-4 w-4 text-emerald-700" /> : null}
              {player.isHost ? <Crown className="h-4 w-4 text-amber-500" /> : null}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RevealStat({ label, value }) {
  return (
    <div className="rounded-[8px] border border-white/80 bg-white/75 p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 min-w-0 break-words text-xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function getResultMessage(result, t) {
  switch (result.outcome) {
    case "tie":
      return t.resultTie;
    case "wrongVote":
      return t.resultWrongVote(result.votedPlayer?.name ?? "");
    case "spyLeft":
      return t.resultSpyLeft;
    case "correctGuess":
      return t.resultCorrectGuess;
    case "wrongGuess":
      return t.resultWrongGuess;
    default:
      return result.message ?? "";
  }
}

export default App;
