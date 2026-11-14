
import { useState } from "react";
import type { FormEvent } from "react";

import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Plus,
  Play,
  CheckCircle2,
  X,
  Users,
  Clock3,
} from "lucide-react";

import type { Queue } from "../types/queue";
import { useQueue } from "../context/QueueContext";

type QueueDetailsProps = {
  queue: Queue;
  onBack: () => void;
};

function QueueDetails({
  queue,
  onBack,
}: QueueDetailsProps) {
  const {
    queues,
    tokens,
    addToken,
    moveToken,
    serveNext,
    completeService,
    cancelToken,
  } = useQueue();

  const [customerName, setCustomerName] = useState("");
  const [error, setError] = useState("");

  // Always read the latest queue data
  const currentQueue =
    queues.find((item) => item.id === queue.id) ?? queue;

  // Tokens belonging to this queue
  const queueTokens = tokens.filter(
    (token) => token.queueId === queue.id
  );

  // Waiting customers, sorted by position
  const waitingTokens = queueTokens
    .filter((token) => token.status === "waiting")
    .sort((a, b) => a.position - b.position);

  // Customer currently being served
  const servingToken = queueTokens.find(
    (token) => token.status === "serving"
  );

  const completedCount = queueTokens.filter(
    (token) => token.status === "completed"
  ).length;

  const cancelledCount = queueTokens.filter(
    (token) => token.status === "cancelled"
  ).length;

  // Add a customer through QueueContext API
  const handleAddToken = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const name = customerName.trim();

    if (!name) {
      setError("Please enter a customer name.");
      return;
    }

    if (currentQueue.status !== "Active") {
      setError("This queue is not active.");
      return;
    }

    setError("");

    // QueueContext sends POST request to Express backend.
    addToken(queue.id, name);

    // Clear form after submitting the request.
    setCustomerName("");
  };

  // Display elapsed waiting time
  const getWaitTime = (createdAt: string) => {
    const created = new Date(createdAt).getTime();

    if (!Number.isFinite(created)) {
      return "—";
    }

    const minutes = Math.max(
      0,
      Math.floor((Date.now() - created) / 60000)
    );

    return minutes === 0
      ? "Just joined"
      : `${minutes} min`;
  };

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600"
      >
        <ArrowLeft size={18} />
        Back to Queues
      </button>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {currentQueue.name}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage customers and service tokens.
          </p>
        </div>

        <span
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            currentQueue.status === "Active"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          {currentQueue.status}
        </span>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: "Waiting",
            value: waitingTokens.length,
          },
          {
            label: "Serving",
            value: servingToken ? 1 : 0,
          },
          {
            label: "Completed",
            value: completedCount,
          },
          {
            label: "Cancelled",
            value: cancelledCount,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-slate-500">
              {stat.label}
            </p>

            <h2 className="mt-3 text-3xl font-bold text-slate-900">
              {stat.value}
            </h2>
          </div>
        ))}
      </div>

      {/* Now Serving */}
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6">
        <p className="text-sm font-semibold tracking-wide text-indigo-600">
          NOW SERVING
        </p>

        <h2 className="mt-3 text-3xl font-bold text-slate-900">
          {servingToken
            ? `#${servingToken.tokenNumber}`
            : "No active service"}
        </h2>

        {servingToken && (
          <p className="mt-2 text-slate-600">
            {servingToken.customerName}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          {/* Serve Next */}
          <button
            type="button"
            onClick={() => serveNext(queue.id)}
            disabled={
              currentQueue.status !== "Active" ||
              Boolean(servingToken) ||
              waitingTokens.length === 0
            }
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Play size={17} />
            Serve Next
          </button>

          {/* Complete Service */}
          <button
            type="button"
            onClick={() => completeService(queue.id)}
            disabled={!servingToken}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCircle2 size={17} />
            Complete Service
          </button>
        </div>
      </div>

      {/* Add Customer */}
      <form
        onSubmit={handleAddToken}
        className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-slate-900">
          Add Customer
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Create a new token for a waiting customer.
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={customerName}
            onChange={(event) => {
              setCustomerName(event.target.value);
              setError("");
            }}
            placeholder="Enter customer name"
            aria-label="Customer name"
            maxLength={80}
            required
            disabled={currentQueue.status !== "Active"}
            className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
          />

          <button
            type="submit"
            disabled={currentQueue.status !== "Active"}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={18} />
            Add Token
          </button>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-3 text-sm text-red-600"
          >
            {error}
          </p>
        )}
      </form>

      {/* Waiting Queue */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <Users
            size={21}
            className="text-indigo-600"
          />

          <h2 className="text-lg font-semibold text-slate-900">
            Waiting Queue ({waitingTokens.length})
          </h2>
        </div>

        {waitingTokens.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
            <Users
              size={32}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 text-sm text-slate-500">
              No customers waiting.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {waitingTokens.map((token, index) => (
              <div
                key={token.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-indigo-200"
              >
                {/* Token Information */}
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 font-bold text-indigo-600">
                    {token.position}
                  </div>

                  <div>
                    <p className="font-semibold text-slate-900">
                      #{token.tokenNumber}
                    </p>

                    <p className="text-sm text-slate-600">
                      {token.customerName}
                    </p>

                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                      <Clock3 size={13} />
                      {getWaitTime(token.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Token Action Buttons */}
                <div className="flex items-center gap-2">
                  {/* Move Up */}
                  <button
                    type="button"
                    onClick={() =>
                      moveToken(
                        queue.id,
                        token.id,
                        "up"
                      )
                    }
                    disabled={index === 0}
                    aria-label={`Move ${token.tokenNumber} up`}
                    className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ArrowUp size={18} />
                  </button>

                  {/* Move Down */}
                  <button
                    type="button"
                    onClick={() =>
                      moveToken(
                        queue.id,
                        token.id,
                        "down"
                      )
                    }
                    disabled={
                      index === waitingTokens.length - 1
                    }
                    aria-label={`Move ${token.tokenNumber} down`}
                    className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ArrowDown size={18} />
                  </button>

                  {/* Cancel Token */}
                  <button
                    type="button"
                    onClick={() =>
                      cancelToken(queue.id, token.id)
                    }
                    aria-label={`Cancel ${token.tokenNumber}`}
                    className="rounded-lg border border-red-100 p-2 text-red-500 hover:bg-red-50"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default QueueDetails;
