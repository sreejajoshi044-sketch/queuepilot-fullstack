
export type QueueStatus = "Active" | "Paused";

export type Queue = {
  id: string;
  name: string;
  status: QueueStatus;
  waitingTokens: number;
  nowServing: string | null;
};

export type TokenStatus =
  | "waiting"
  | "serving"
  | "completed"
  | "cancelled";

export type Token = {
  id: string;
  tokenNumber: string;
  customerName: string;
  status: TokenStatus;
  position: number;
  createdAt: string;
  servedAt: string | null;
  completedAt: string | null;
};
