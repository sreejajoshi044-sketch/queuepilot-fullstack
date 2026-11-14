
import { useState } from "react";
import { useQueue } from "../context/QueueContext";

import CreateQueueModal from "./CreateQueueModal";
import QueueDetails from "./QueueDetails";

import {
  Plus,
  ListOrdered,
  Users,
  Activity,
  ArrowRight,
  Search,
} from "lucide-react";

function Queues() {
  // Real queue data from PostgreSQL through QueueContext
  const { queues, createQueue } = useQueue();

  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQueueId, setSelectedQueueId] = useState<
    string | null
  >(null);
  const [isCreating, setIsCreating] = useState(false);

  // Filter queues by name
  const filteredQueues = queues.filter((queue) =>
    queue.name.toLowerCase().includes(search.toLowerCase())
  );

  // Calculate statistics from real queue data
  const activeQueues = queues.filter(
    (queue) => queue.status === "Active"
  ).length;

  const totalWaiting = queues.reduce(
    (total, queue) => total + queue.waitingTokens,
    0
  );

  // Create queue using Express + PostgreSQL
  const handleCreateQueue = async (name: string) => {
    if (isCreating) return;

    setIsCreating(true);

    try {
      const success = await createQueue(name);

      if (success) {
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error("Create queue failed:", error);
      alert("Unable to create queue. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  // Always use the latest queue data
  const selectedQueue = selectedQueueId
    ? queues.find((queue) => queue.id === selectedQueueId)
    : null;

  // Display queue details
  if (selectedQueue) {
    return (
      <QueueDetails
        queue={selectedQueue}
        onBack={() => setSelectedQueueId(null)}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            My Queues
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Create, manage, and monitor your queues.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          disabled={isCreating}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus size={18} />
          Create Queue
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {[
          {
            title: "Total Queues",
            value: queues.length,
            icon: ListOrdered,
          },
          {
            title: "Active Queues",
            value: activeQueues,
            icon: Activity,
          },
          {
            title: "Waiting Tokens",
            value: totalWaiting,
            icon: Users,
          },
        ].map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  {stat.title}
                </p>

                <div className="rounded-xl bg-indigo-50 p-3">
                  <Icon
                    size={20}
                    className="text-indigo-600"
                  />
                </div>
              </div>

              <h2 className="mt-3 text-3xl font-bold text-slate-900">
                {stat.value}
              </h2>
            </div>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search
          size={19}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search queues..."
          aria-label="Search queues"
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      {/* Queue Cards */}
      {filteredQueues.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredQueues.map((queue) => (
            <div
              key={queue.id}
              className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Queue Status */}
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-indigo-50 p-3">
                  <ListOrdered
                    size={23}
                    className="text-indigo-600"
                  />
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    queue.status === "Active"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {queue.status}
                </span>
              </div>

              {/* Queue Name */}
              <h3 className="mt-5 text-lg font-bold text-slate-900">
                {queue.name}
              </h3>

              {/* Queue Information */}
              <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-5">
                <div>
                  <p className="text-xs text-slate-400">
                    Waiting Tokens
                  </p>

                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {queue.waitingTokens}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Now Serving
                  </p>

                  <p className="mt-2 text-xl font-bold text-indigo-600">
                    {queue.nowServing
                      ? `#${queue.nowServing}`
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Manage Queue Button */}
              <button
                type="button"
                onClick={() => setSelectedQueueId(queue.id)}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-100"
              >
                Manage Queue
                <ArrowRight size={17} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <ListOrdered
            size={36}
            className="mx-auto text-slate-300"
          />

          <h3 className="mt-4 font-semibold text-slate-700">
            {queues.length === 0
              ? "No queues created yet"
              : "No queues found"}
          </h3>

          <p className="mt-2 text-sm text-slate-400">
            {queues.length === 0
              ? "Create your first queue to get started."
              : "Try searching with another queue name."}
          </p>
        </div>
      )}

      {/* Create Queue Modal */}
      <CreateQueueModal
        isOpen={isModalOpen}
        onClose={() => {
          if (!isCreating) {
            setIsModalOpen(false);
          }
        }}
        onCreate={handleCreateQueue}
      />
    </div>
  );
}

export default Queues;
