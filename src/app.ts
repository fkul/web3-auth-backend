import express from "express";
import http from "http";

import { Server } from "socket.io";
import { Message, User } from "./types";
import { mapToArray } from "./utils";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});
app.use(express.json());

let users: Map<string, User> = new Map();
let messages: Message[] = [];

app.post("/join", (req, res) => {
  const user: User = {
    socketId: req.body.socketId,
    displayName: req.body.address ?? `Anon-${req.body.socketId}`,
    level: req.body.address ? "connected" : "anonymous",
  };

  if (users.has(req.body.socketId)) {
    messages.push({
      date: new Date(),
      from: users.get(req.body.socketId)!,
      value: `/me is now ${user.displayName}`,
    });
  } else {
    messages.push({ date: new Date(), from: user, value: `/me joined` });
  }

  users.set(user.socketId, user);
  io.emit("users", mapToArray(users));
  io.emit("messages", messages);
  res.send();
});

app.post("/leave", (req, res) => {
  messages.push({ date: new Date(), from: req.body.user, value: `/me left` });
  io.emit("messages", messages);
  users.delete(req.body.user.socketId);
  io.emit("users", mapToArray(users));
  res.send();
});

app.post("/message", (req, res) => {
  messages.push(req.body);
  io.emit("messages", messages);
  res.send();
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
