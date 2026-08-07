import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { io as createClient } from "socket.io-client";

const PORT = 3101;
const URL = `http://localhost:${PORT}`;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function hasArabicLetters(value) {
  return /\p{Script=Arabic}/u.test(value);
}

function startServer() {
  const server = spawn(process.execPath, ["server.js"], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(PORT) },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let output = "";
  server.stdout.on("data", (chunk) => {
    output += chunk.toString();
  });
  server.stderr.on("data", (chunk) => {
    output += chunk.toString();
  });

  server.output = () => output;
  return server;
}

async function waitForServer(server) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(`Server exited early:\n${server.output()}`);
    }

    try {
      const response = await fetch(`${URL}/api/health`);
      if (response.ok) {
        return;
      }
    } catch {
      await delay(250);
    }
  }

  throw new Error(`Server did not become ready:\n${server.output()}`);
}

async function connectPlayer(name) {
  const socket = createClient(URL, {
    autoConnect: false,
    reconnection: false,
  });

  socket.latestState = null;
  socket.on("roomState", (state) => {
    socket.latestState = state;
  });

  await new Promise((resolve, reject) => {
    socket.once("connect", resolve);
    socket.once("connect_error", reject);
    socket.connect();
  });

  return { name, socket };
}

function emit(socket, event, payload = {}) {
  return new Promise((resolve, reject) => {
    socket.timeout(2000).emit(event, payload, (error, response) => {
      if (error) {
        reject(error);
        return;
      }

      if (!response?.ok) {
        reject(new Error(response?.message || `${event} failed`));
        return;
      }

      resolve(response);
    });
  });
}

async function assertEmitFails(socket, event, payload, message) {
  try {
    await emit(socket, event, payload);
  } catch {
    return;
  }

  throw new Error(message);
}

function waitForState(socket, predicate, label, timeoutMs = 4000) {
  if (socket.latestState && predicate(socket.latestState)) {
    return Promise.resolve(socket.latestState);
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off("roomState", handler);
      reject(new Error(`Timed out waiting for ${label}`));
    }, timeoutMs);

    const handler = (state) => {
      if (predicate(state)) {
        clearTimeout(timer);
        socket.off("roomState", handler);
        resolve(state);
      }
    };

    socket.on("roomState", handler);
  });
}

async function main() {
  const server = startServer();
  const clients = [];

  try {
    await waitForServer(server);

    clients.push(await connectPlayer("Host"));
    clients.push(await connectPlayer("Maya"));
    clients.push(await connectPlayer("Omar"));

    const [host, maya, omar] = clients;
    const createResponse = await emit(host.socket, "createRoom", { playerName: host.name, language: "en" });
    const roomCode = createResponse.roomCode;

    await emit(host.socket, "setLanguage", { roomCode, language: "ar" });
    await waitForState(host.socket, (state) => state.language === "ar", "Arabic room language");

    await emit(maya.socket, "joinRoom", { roomCode, playerName: maya.name });
    await emit(omar.socket, "joinRoom", { roomCode, playerName: omar.name });
    await Promise.all(clients.map((client) => waitForState(client.socket, (state) => state.playerCount === 3, "full lobby")));
    assert(clients.every((client) => client.socket.latestState.language === "ar"), "Room language was not synchronized.");

    await emit(host.socket, "startGame", { roomCode });
    const roleStates = await Promise.all(clients.map((client) => waitForState(client.socket, (state) => state.phase === "role", "role view")));

    const spyIndex = roleStates.findIndex((state) => state.role.kind === "spy");
    assert(spyIndex >= 0, "A spy was not assigned.");

    const targetWord = roleStates.find((state) => state.role.kind === "inside")?.role.word;
    assert(targetWord, "Inside players did not receive a target word.");
    assert(hasArabicLetters(targetWord), "Arabic room did not receive an Arabic target word.");

    await Promise.all(clients.map((client) => emit(client.socket, "ackRole", { roomCode })));
    const questioningStates = await Promise.all(
      clients.map((client) => waitForState(client.socket, (state) => state.phase === "questioning", "questioning")),
    );
    const firstQuestioningState = questioningStates[0];
    assert(firstQuestioningState.questioning.durationSeconds === 300, "Questioning duration should be 5 minutes.");
    assert(firstQuestioningState.questioning.endsAt > Date.now(), "Questioning countdown was not scheduled.");
    assert(firstQuestioningState.questioning.currentAsker?.id, "Initial asker was not assigned.");
    assert(firstQuestioningState.questioning.currentAnswerer?.id, "Initial answerer was not assigned.");

    const asker = clients.find((client) => client.socket.id === firstQuestioningState.questioning.currentAsker.id);
    const answerer = clients.find((client) => client.socket.id === firstQuestioningState.questioning.currentAnswerer.id);
    const blockedTarget = clients.find(
      (client) => client.socket.id !== asker.socket.id && client.socket.id !== answerer.socket.id,
    );
    assert(blockedTarget, "No blocked next target candidate was available.");
    assert(answerer.socket.latestState.questioning.canChooseNext === false, "Answerer should not choose before answer confirmation.");
    await assertEmitFails(
      answerer.socket,
      "chooseNextQuestionTarget",
      { roomCode, targetId: blockedTarget.socket.id },
      "Answerer was able to choose the next target before the asker confirmed the answer.",
    );

    assert(asker.socket.latestState.questioning.canConfirmAnswer === true, "Current asker should be able to confirm the answer.");
    await emit(asker.socket, "confirmQuestionAnswer", { roomCode });
    await Promise.all(
      clients.map((client) =>
        waitForState(
          client.socket,
          (state) => state.phase === "questioning" && state.questioning.answerConfirmed === true,
          "answer confirmation",
        ),
      ),
    );

    const nextTargetId = answerer.socket.latestState.questioning.eligibleTargetIds[0];
    assert(nextTargetId, "Answerer did not receive an eligible next target.");
    await emit(answerer.socket, "chooseNextQuestionTarget", { roomCode, targetId: nextTargetId });
    await Promise.all(
      clients.map((client) =>
        waitForState(
          client.socket,
          (state) =>
            state.phase === "questioning" &&
            state.questioning.turnNumber === 2 &&
            state.questioning.currentAsker.id === answerer.socket.id &&
            state.questioning.currentAnswerer.id === nextTargetId,
          "next questioning turn",
        ),
      ),
    );

    await emit(host.socket, "readyToVote", { roomCode });
    await emit(maya.socket, "readyToVote", { roomCode });
    await Promise.all(clients.map((client) => waitForState(client.socket, (state) => state.phase === "voting", "voting")));

    const spy = clients[spyIndex];
    const inside = clients.find((client) => client !== spy);

    for (const client of clients) {
      const targetId = client === spy ? inside.socket.id : spy.socket.id;
      await emit(client.socket, "castVote", { roomCode, targetId });
    }

    await Promise.all(clients.map((client) => waitForState(client.socket, (state) => state.phase === "spyGuess", "spy guessing")));
    assert(spy.socket.latestState.spyGuess.options.includes(targetWord), "Spy guess options did not include the target word.");
    assert(
      spy.socket.latestState.spyGuess.options.every((word) => hasArabicLetters(word)),
      "Arabic room did not receive Arabic spy guess options.",
    );

    await emit(spy.socket, "submitSpyGuess", { roomCode, word: targetWord });
    const revealStates = await Promise.all(clients.map((client) => waitForState(client.socket, (state) => state.phase === "reveal", "reveal")));

    assert(revealStates.every((state) => state.result.winner === "spy"), "Expected spy to win after a correct guess.");
    console.log("Smoke test passed: lobby, roles, majority-ready voting, spy guess, and reveal all synchronized.");
  } finally {
    for (const client of clients) {
      client.socket.disconnect();
    }
    server.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
