
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { ReactNode } from "react";
import type { Queue, Token } from "../types/queue";

export type StoredToken = Token & {
  queueId: string;
};

type QueueContextType = {
  queues: Queue[];
  tokens: StoredToken[];
  createQueue: (name: string) => Promise<boolean>;
  addToken: (queueId: string, customerName: string) => void;
  moveToken: (
    queueId: string,
    tokenId: string,
    direction: "up" | "down"
  ) => void;
  serveNext: (queueId: string) => void;
  completeService: (queueId: string) => void;
  cancelToken: (queueId: string, tokenId: string) => void;
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

type QueueListResponse =
  | Queue[]
  | { queues: Queue[] };

type TokenListResponse =
  | StoredToken[]
  | { tokens: StoredToken[] };

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const QueueContext = createContext<QueueContextType | undefined>(
  undefined
);

// Reusable API helper
async function apiRequest<T>(
  endpoint: string,
  method = "GET",
  body?: object
): Promise<T> {
  const token = sessionStorage.getItem("queueflow_token");

  if (!token) {
    throw new Error("Please log in again.");
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const result: ApiResponse<T> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(
      result.message || `Request failed: ${response.status}`
    );
  }

  return result.data;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Something went wrong.";
}

export function QueueProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [storedQueues, setStoredQueues] = useState<Queue[]>([]);
  const [tokens, setTokens] = useState<StoredToken[]>([]);

  // Fetch queues and their tokens from PostgreSQL
  const refreshData = useCallback(async () => {
    const token = sessionStorage.getItem("queueflow_token");

    if (!token) {
      setStoredQueues([]);
      setTokens([]);
      return;
    }

    const queueResponse =
      await apiRequest<QueueListResponse>("/api/queues");

    const fetchedQueues = Array.isArray(queueResponse)
      ? queueResponse
      : queueResponse.queues;

    if (!Array.isArray(fetchedQueues)) {
      throw new Error("Unexpected queue response format.");
    }

    setStoredQueues(fetchedQueues);

    const tokenResponses = await Promise.all(
      fetchedQueues.map(async (queue) => {
        const tokenResponse =
          await apiRequest<TokenListResponse>(
            `/api/queues/${queue.id}/tokens`
          );

        const queueTokens = Array.isArray(tokenResponse)
          ? tokenResponse
          : tokenResponse.tokens;

        if (!Array.isArray(queueTokens)) {
          throw new Error("Unexpected token response format.");
        }

        return queueTokens.map((item) => ({
          ...item,
          queueId: queue.id,
        }));
      })
    );

    setTokens(tokenResponses.flat());
  }, []);

  // Load backend data after login
  useEffect(() => {
    const load = () => {
      void refreshData().catch((error: unknown) => {
        console.error("Failed to load QueueFlow data:", error);
      });
    };

    load();

    window.addEventListener("queueflow-auth-changed", load);

    return () => {
      window.removeEventListener("queueflow-auth-changed", load);
    };
  }, [refreshData]);

  // Calculate current queue statistics
  const queues = useMemo(
    () =>
      storedQueues.map((queue) => {
        const queueTokens = tokens.filter(
          (item) => item.queueId === queue.id
        );

        const serving = queueTokens.find(
          (item) => item.status === "serving"
        );

        return {
          ...queue,
          waitingTokens: queueTokens.filter(
            (item) => item.status === "waiting"
          ).length,
          nowServing: serving?.tokenNumber ?? null,
        };
      }),
    [storedQueues, tokens]
  );

  // Create queue using backend
  const createQueue = async (name: string): Promise<boolean> => {
    const trimmedName = name.trim();

    if (
      trimmedName.length < 3 ||
      trimmedName.length > 60
    ) {
      alert("Queue name must contain 3 to 60 characters.");
      return false;
    }

    try {
      await apiRequest(
        "/api/queues",
        "POST",
        { name: trimmedName }
      );

      await refreshData();
      return true;
    } catch (error) {
      alert(getErrorMessage(error));
      return false;
    }
  };

  // Common helper for token operations
  const performTokenAction = async (
    endpoint: string,
    method: string,
    body?: object
  ) => {
    try {
      await apiRequest(endpoint, method, body);
      await refreshData();
    } catch (error) {
      console.error("Token operation failed:", error);
      alert(getErrorMessage(error));
    }
  };

  // Add customer token
  const addToken = (
    queueId: string,
    customerName: string
  ) => {
    const name = customerName.trim();

    if (!name) {
      alert("Please enter the customer name.");
      return;
    }

    void performTokenAction(
      `/api/queues/${queueId}/tokens`,
      "POST",
      { customerName: name }
    );
  };

  // Move token up or down
  const moveToken = (
    queueId: string,
    tokenId: string,
    direction: "up" | "down"
  ) => {
    void performTokenAction(
      `/api/queues/${queueId}/tokens/${tokenId}/move`,
      "PATCH",
      { direction }
    );
  };

  // Serve next waiting customer
  const serveNext = (queueId: string) => {
    void performTokenAction(
      `/api/queues/${queueId}/serve-next`,
      "POST"
    );
  };

  // Complete current service
  const completeService = (queueId: string) => {
    void performTokenAction(
      `/api/queues/${queueId}/complete`,
      "PATCH"
    );
  };

  // Cancel a waiting customer token
  const cancelToken = (
    queueId: string,
    tokenId: string
  ) => {
    void performTokenAction(
      `/api/queues/${queueId}/tokens/${tokenId}/cancel`,
      "PATCH"
    );
  };

  return (
    <QueueContext.Provider
      value={{
        queues,
        tokens,
        createQueue,
        addToken,
        moveToken,
        serveNext,
        completeService,
        cancelToken,
      }}
    >
      {children}
    </QueueContext.Provider>
  );
}

export function useQueue() {
  const context = useContext(QueueContext);

  if (!context) {
    throw new Error(
      "useQueue must be used inside QueueProvider"
    );
  }

  return context;
}
