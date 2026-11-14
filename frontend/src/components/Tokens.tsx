
import { useState } from "react";
import type { FormEvent } from "react";

import {
  Search,
  Plus,
  Users,
  ListOrdered,
  Play,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  X,
} from "lucide-react";

import { useQueue } from "../context/QueueContext";

function Tokens() {
  const {
    queues,
    tokens,
    addToken,
    moveToken,
    serveNext,
    completeService,
    cancelToken,
  } = useQueue();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [queueFilter, setQueueFilter] = useState("all");
  const [customerName, setCustomerName] = useState("");
  const [selectedQueueId, setSelectedQueueId] = useState("");

  // Only active queues can receive new tokens.
  const activeQueues = queues.filter(
    (queue) => queue.status === "Active"
  );

  const addQueueId =
    activeQueues.some((queue) => queue.id === selectedQueueId)
      ? selectedQueueId
      : activeQueues[0]?.id ?? "";

  const getQueueName = (queueId: string) => {
    return (
      queues.find((queue) => queue.id === queueId)?.name ??
      "Unknown Queue"
    );
  };

  const filteredTokens = tokens
    .filter((token) => {
      const matchesSearch =
        token.customerName
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        token.tokenNumber
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        getQueueName(token.queueId)
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        token.status === statusFilter;

      const matchesQueue =
        queueFilter === "all" ||
        token.queueId === queueFilter;

      return matchesSearch && matchesStatus && matchesQueue;
    })
    .sort((a, b) => {
      if (a.queueId === b.queueId) {
        return a.position - b.position;
      }

      return a.queueId.localeCompare(b.queueId);
    });

  const waitingCount = tokens.filter(
    (token) => token.status === "waiting"
  ).length;

  const servingCount = tokens.filter(
    (token) => token.status === "serving"
  ).length;

  const completedCount = tokens.filter(
    (token) => token.status === "completed"
  ).length;

  const handleAddCustomer = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const name = customerName.trim();

    if (!name || !addQueueId) {
      return;
    }

    // QueueContext sends the request to PostgreSQL.
    addToken(addQueueId, name);
    setCustomerName("");
  };

  const handleServeNext = (queueId: string) => {
    serveNext(queueId);
  };

  const handleCompleteService = (queueId: string) => {
    completeService(queueId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "waiting":
        return "bg-amber-50 text-amber-700";
      case "serving":
        return "bg-blue-50 text-blue-700";
      case "completed":
        return "bg-emerald-50 text-emerald-700";
      case "cancelled":
        return "bg-red-50 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Token Management
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Manage customer tokens across all service queues.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            title: "Total Tokens",
            value: tokens.length,
            icon: ListOrdered,
          },
          {
            title: "Waiting",
            value: waitingCount,
            icon: Users,
          },
          {
            title: "Serving",
            value: servingCount,
            icon: Play,
          },
          {
            title: "Completed",
            value: completedCount,
            icon: CheckCircle2,
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  {item.title}
                </p>

                <Icon
                  size={20}
                  className="text-indigo-600"
                />
              </div>

              <h2 className="mt-3 text-3xl font-bold text-slate-900">
                {item.value}
              </h2>
            </div>
          );
        })}
      </div>

      {/* Add Customer */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Add New Customer
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Generate a new customer token.
        </p>

        <form
          onSubmit={handleAddCustomer}
          className="mt-5 flex flex-col gap-3 md:flex-row"
        >
          <select
            value={addQueueId}
            onChange={(e) =>
              setSelectedQueueId(e.target.value)
            }
            disabled={activeQueues.length === 0}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
            aria-label="Select queue for new customer"
          >
            {activeQueues.length === 0 ? (
              <option value="">
                No active queues
              </option>
            ) : (
              activeQueues.map((queue) => (
                <option key={queue.id} value={queue.id}>
                  {queue.name}
                </option>
              ))
            )}
          </select>

          <input
            type="text"
            value={customerName}
            onChange={(e) =>
              setCustomerName(e.target.value)
            }
            placeholder="Enter customer name"
            maxLength={80}
            required
            disabled={!addQueueId}
            className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
          />

          <button
            type="submit"
            disabled={!addQueueId}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <Plus size={18} />
            Add Token
          </button>
        </form>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tokens or customers..."
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={queueFilter}
          onChange={(e) => setQueueFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
          aria-label="Filter by queue"
        >
          <option value="all">All Queues</option>

          {queues.map((queue) => (
            <option key={queue.id} value={queue.id}>
              {queue.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value)
          }
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
          aria-label="Filter by status"
        >
          <option value="all">All Statuses</option>
          <option value="waiting">Waiting</option>
          <option value="serving">Serving</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Token Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Customer Tokens ({filteredTokens.length})
          </h2>
        </div>

        {filteredTokens.length === 0 ? (
          <div className="p-12 text-center">
            <Users
              size={36}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 text-sm text-slate-500">
              No tokens found.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="p-4">Token</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Queue</th>
                  <th className="p-4">Position</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredTokens.map((token) => {
                  const queue = queues.find(
                    (item) => item.id === token.queueId
                  );

                  const queueWaiting = tokens
                    .filter(
                      (item) =>
                        item.queueId === token.queueId &&
                        item.status === "waiting"
                    )
                    .sort(
                      (a, b) => a.position - b.position
                    );

                  const waitingIndex =
                    queueWaiting.findIndex(
                      (item) => item.id === token.id
                    );

                  const isServing = tokens.some(
                    (item) =>
                      item.queueId === token.queueId &&
                      item.status === "serving"
                  );

                  return (
                    <tr
                      key={token.id}
                      className="border-t border-slate-100"
                    >
                      <td className="p-4 font-semibold text-indigo-600">
                        #{token.tokenNumber}
                      </td>

                      <td className="p-4 text-slate-700">
                        {token.customerName}
                      </td>

                      <td className="p-4 text-slate-700">
                        {getQueueName(token.queueId)}
                      </td>

                      <td className="p-4 text-slate-700">
                        {token.status === "waiting"
                          ? token.position
                          : "—"}
                      </td>

                      <td className="p-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(
                            token.status
                          )}`}
                        >
                          {token.status}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {token.status === "waiting" && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  moveToken(
                                    token.queueId,
                                    token.id,
                                    "up"
                                  )
                                }
                                disabled={waitingIndex <= 0}
                                title="Move Up"
                                className="rounded-lg border border-slate-200 p-2 disabled:opacity-30"
                              >
                                <ArrowUp size={16} />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  moveToken(
                                    token.queueId,
                                    token.id,
                                    "down"
                                  )
                                }
                                disabled={
                                  waitingIndex ===
                                  queueWaiting.length - 1
                                }
                                title="Move Down"
                                className="rounded-lg border border-slate-200 p-2 disabled:opacity-30"
                              >
                                <ArrowDown size={16} />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  cancelToken(
                                    token.queueId,
                                    token.id
                                  )
                                }
                                title="Cancel Token"
                                className="rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50"
                              >
                                <X size={16} />
                              </button>

                              {waitingIndex === 0 &&
                                !isServing &&
                                queue?.status === "Active" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleServeNext(
                                        token.queueId
                                      )
                                    }
                                    title="Serve Next"
                                    className="rounded-lg border border-indigo-200 p-2 text-indigo-600 hover:bg-indigo-50"
                                  >
                                    <Play size={16} />
                                  </button>
                                )}
                            </>
                          )}

                          {token.status === "serving" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleCompleteService(
                                  token.queueId
                                )
                              }
                              className="flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                            >
                              <CheckCircle2 size={16} />
                              Complete
                            </button>
                          )}

                          {(token.status === "completed" ||
                            token.status === "cancelled") && (
                            <span className="text-xs text-slate-400">
                              No actions
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Tokens;
