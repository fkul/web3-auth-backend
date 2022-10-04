import { Router } from "express";
import { IOServer } from "../app";
import { Message, restrictedUserLevels, User, Users } from "../types";
import { getLevel, mapToArray } from "../utils";

const router = Router();

export const chat = (io: IOServer, users: Users, messages: Message[]) => {
  router.post("/join", async (req, res) => {
    const { socketId, address } = req.body;
    const existingUser = users.get(socketId);

    const user: User = {
      socketId,
      displayName: address ?? `Anon-${socketId}`,
      level: address ? await getLevel(address, req.session) : "anonymous",
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

  router.post("/leave", (req, res) => {
    const { user } = req.body;

    messages.push({ date: new Date(), from: user, value: `/me left` });
    io.emit("messages", messages);

    users.delete(user.socketId);
    io.emit("users", mapToArray(users));

    res.end();
  });

  router.post("/message", (req, res) => {
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

  router.post("/clear", async (req, res) => {
    const address = req.session.siwe?.address;

    if (!address || (await getLevel(address, req.session)) !== "moderator") {
      return res.status(403).end();
    }

    messages.length = 0;
    io.emit("messages", messages);

    res.end();
  });

  return router;
};
