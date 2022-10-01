type UserLevel = "anonymous" | "connected" | "authenticated" | "vip";

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
