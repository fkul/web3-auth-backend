import express from "express";
import http from "http";

import { Server } from "socket.io";
import { Message, User } from "./types";

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

let users: User[] = [];
let messages: Message[] = [];

app.post("/join", (req, res) => {
  const user: User = {
    socketId: req.body.socketId,
    displayName: `Anon-${req.body.socketId}`,
    level: "anonymous",
  };

  users.push(user);
  io.emit("users", users);
  messages.push({ date: new Date(), from: user, value: `/me joined` });
  io.emit("messages", messages);
  res.json(user);
});

app.post("/leave", (req, res) => {
  messages.push({ date: new Date(), from: req.body.user, value: `/me left` });
  io.emit("messages", messages);
  users = users.filter((user) => user.socketId !== req.body.user.socketId);
  io.emit("users", users);
  res.send();
});

app.post("/message", (req, res) => {
  messages.push(req.body);
  io.emit("messages", messages);
  res.send();
});

io.on("connection", (socket) => {
  console.log(`Connected: ${socket.id}`);

  socket.emit("users", users);
  socket.emit("messages", messages);

  socket.on("disconnect", () => {
    console.log(`Disconnected: ${socket.id}`);
    users.splice(
      users.findIndex(({ socketId }) => socketId === socket.id),
      1
    );
    io.emit("users", users);
  });
});

server.listen(process.env.PORT || 3001, () => {
  console.log("Listening...");
});
