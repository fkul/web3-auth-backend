import express from "express";
import session from "express-session";
import http from "http";
import dotenv from "dotenv";
import { Server } from "socket.io";
import { Message, Users } from "./types";
import { mapToArray } from "./utils";
import { chat } from "./routes/chat";
import { auth } from "./routes/auth";

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
export type IOServer = typeof io;

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

dotenv.config();

const users: Users = new Map();
const messages: Message[] = [];

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

app.use("/auth", auth());
app.use("/chat", chat(io, users, messages));

server.listen(process.env.PORT || 3001, () => {
  console.log("Listening...");
});
