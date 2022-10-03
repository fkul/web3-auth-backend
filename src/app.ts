import express from "express";
import session from "express-session";
import http from "http";
import { generateNonce, SiweMessage } from "siwe";

import { Server } from "socket.io";
import { Message, restrictedUserLevels, User } from "./types";
import { mapToArray } from "./utils";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
app.use((_, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});
app.use(
  session({
    name: "web3-auth-demo",
    secret: "web3-auth-demo-secret",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(express.json());

declare module "express-session" {
  interface SessionData {
    nonce?: string;
    siwe?: SiweMessage;
  }
}

let users: Map<string, User> = new Map();
let messages: Message[] = [];

app.post("/api/chat/join", (req, res) => {
  const { socketId, address } = req.body;
  const existingUser = users.get(socketId);
  const user: User = {
    socketId,
    displayName: address ?? `Anon-${socketId}`,
    level: address
      ? address === req.session.siwe?.address
        ? "authenticated"
        : "connected"
      : "anonymous",
  };

  if (!existingUser) {
    messages.push({ date: new Date(), from: user, value: `/me joined` });
  } else if (existingUser.level !== user.level) {
    messages.push({
      date: new Date(),
      from: users.get(socketId)!,
      value: `/me changed level: ${user.level}`,
    });
  }

  users.set(user.socketId, user);
  io.emit("users", mapToArray(users));
  io.emit("messages", messages);
  res.end();
});

app.post("/api/chat/leave", (req, res) => {
  const { user } = req.body;
  messages.push({ date: new Date(), from: user, value: `/me left` });
  io.emit("messages", messages);
  users.delete(user.socketId);
  io.emit("users", mapToArray(users));
  res.end();
});

app.post("/api/chat/message", (req, res) => {
  const message: Message = req.body;
  if (
    restrictedUserLevels.includes(message.from.level) &&
    message.from.displayName !== req.session.siwe?.address
  ) {
    return res.status(401).end();
  }
  messages.push(message);
  io.emit("messages", messages);
  res.end();
});

app.get("/api/auth/nonce", (req, res) => {
  req.session.nonce = generateNonce();
  res.send(req.session.nonce);
});

app.post("/api/auth/validate", async (req, res) => {
  try {
    const { message, signature } = req.body;
    const siweMessage = new SiweMessage(message);
    const fields = await siweMessage.validate(signature);

    if (fields.nonce !== req.session.nonce) {
      return res.status(422).end("Invalid nonce");
    }

    req.session.siwe = fields;
    req.session.save(() => res.end());
  } catch (e) {
    res.status(401).end();
  }
});

app.get("/api/auth/me", (req, res) => {
  req.session.siwe?.address
    ? res.send(req.session.siwe?.address)
    : res.status(401).end();
});

app.post("/api/auth/sign-out", async (req, res) => {
  req.session.destroy(() => res.end());
});

io.on("connection", (socket) => {
  console.log(`Connected: ${socket.id}`);

  socket.emit("users", mapToArray(users));
  socket.emit("messages", messages);

  socket.on("disconnect", () => {
    console.log(`Disconnected: ${socket.id}`);
    users.delete(socket.id);
    io.emit("users", mapToArray(users));
  });
});

server.listen(process.env.PORT || 3001, () => {
  console.log("Listening...");
});
