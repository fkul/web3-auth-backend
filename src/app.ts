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

const users: User[] = [];
const messages: Message[] = [];

app.post("/join", (req, res) => {
  const user: User = {
    socketId: req.body.socketId,
    displayName: `Anon-${req.body.socketId}`,
    level: "anonymous",
  };

  users.push(user);
  res.json(user);

  io.emit("users", users);
  res.status(200).send();
});

app.post("/message", (req, res) => {
  messages.push(req.body);
  io.emit("messages", messages);
  res.status(200).send();
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
