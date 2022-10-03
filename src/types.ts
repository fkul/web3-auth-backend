type UserLevel = "anonymous" | "connected" | "authenticated" | "moderator";

export const restrictedUserLevels: UserLevel[] = ["authenticated", "moderator"];

export interface User {
  socketId: string;
  level: UserLevel;
  displayName: string;
}

export interface Message {
  date: Date;
  from: User;
  value: string;
}
