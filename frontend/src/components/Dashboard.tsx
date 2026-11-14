
import { useEffect, useState } from "react";

import {
  ListOrdered,
  Users,
  CheckCircle2,
  Clock3,
  Plus,
} from "lucide-react";

import StatCard from "./dashboard/StatCard";
import QueueActivityChart from "./dashboard/QueueActivityChart";
import { useQueue } from "../context/QueueContext";

type DashboardProps = {
  onCreateQueue: () => void;
};

type DashboardAnalytics = {
  totalQueues?: number;
  activeQueues?: number;
  waitingCustomers?: number;
  waitingTokens?: number;
  servedToday?: number;
  averageWaitMinutes?: number;
  averageWaitTime?: number;
};

type DashboardResponse = {
  success: boolean;
  message?: string;
  data?: DashboardAnalytics;
};

const API_URL = "http://localhost:5000";

function Dashboard({ onCreateQueue }: DashboardProps) {
  const { queues, tokens } = useQueue();

  const [analytics, setAnalytics] =
    useState<DashboardAnalytics | null>(null);

  const [loading, setLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState("");

  // Fetch dashboard analytics from Express + PostgreSQL
  useEffect(() => {
    let cancelled = false;

    const fetchAnalytics = async () => {
      const token = sessionStorage.getItem(
        "queueflow_token"
      );

      if (!token) {
        if (!cancelled) {
          setAnalytics(null);
          setAnalyticsError("Please log in again.");
          setLoading(false);
        }
        return;
      }

      if (!cancelled) {
        setLoading(true);
        setAnalyticsError("");
      }

      try {
        const response = await fetch(
          `${API_URL}/api/analytics/dashboard`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const result: DashboardResponse =
          await response.json();

        if (
          !response.ok ||
          !result.success ||
          !result.data
        ) {
          throw new Error(
            result.message ||
              "Unable to load dashboard analytics."
          );
        }

        if (!cancelled) {
          setAnalytics(result.data);
        }
      } catch (error) {
        console.error(
          "Dashboard analytics error:",
          error
        );

        if (!cancelled) {
          setAnalytics(null);
          setAnalyticsError(
            "Analytics unavailable. Showing queue data."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchAnalytics();

    return () => {
      cancelled = true;
    };
  }, [queues, tokens]);

  // Calculate fallback statistics from QueueContext
  const localActiveQueues = queues.filter(
    (queue) => queue.status === "Active"
  ).length;

  const localWaitingTokens = tokens.filter(
    (token) => token.status === "waiting"
  ).length;

  const today = new Date().toDateString();

  const localServedToday = tokens.filter((token) => {
    return (
      token.status === "completed" &&
      Boolean(token.completedAt) &&
      new Date(
        token.completedAt as string
      ).toDateString() === today
    );
  }).length;

  const servedTokens = tokens.filter(
    (token) => Boolean(token.servedAt)
  );

  const totalWaitMinutes = servedTokens.reduce(
    (total, token) => {
      if (!token.servedAt) return total;

      const waitMinutes =
        (new Date(token.servedAt).getTime() -
          new Date(token.createdAt).getTime()) /
        60000;

      return total + (
        Number.isFinite(waitMinutes)
          ? Math.max(0, waitMinutes)
          : 0
      );
    },
    0
  );

  const localAverageWaitTime =
    servedTokens.length > 0
      ? Math.round(
          totalWaitMinutes / servedTokens.length
        )
      : 0;

  // Prefer actual PostgreSQL analytics when available
  const activeQueues =
    analytics?.activeQueues ?? localActiveQueues;

  const waitingTokens =
    analytics?.waitingCustomers ??
    analytics?.waitingTokens ??
    localWaitingTokens;

  const servedToday =
    analytics?.servedToday ?? localServedToday;

  const averageWaitTime =
    analytics?.averageWaitMinutes ??
    analytics?.averageWaitTime ??
    localAverageWaitTime;

  const statistics = [
    {
      title: "Active Queues",
      value: activeQueues,
      icon: ListOrdered,
      color: "text-indigo-600",
      background: "bg-indigo-50",
    },
    {
      title: "Waiting Tokens",
      value: waitingTokens,
      icon: Users,
      color: "text-amber-600",
      background: "bg-amber-50",
    },
    {
      title: "Served Today",
      value: servedToday,
      icon: CheckCircle2,
      color: "text-emerald-600",
      background: "bg-emerald-50",
    },
    {
      title: "Average Wait Time",
      value: `${Math.round(averageWaitTime)} min`,
      icon: Clock3,
      color: "text-violet-600",
      background: "bg-violet-50",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Dashboard Overview
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Monitor queue activity and service performance.
          </p>

          {loading && (
            <p className="mt-2 text-xs text-indigo-600">
              Loading dashboard analytics...
            </p>
          )}

          {analyticsError && (
            <p
              role="status"
              className="mt-2 text-xs text-amber-600"
            >
              {analyticsError}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onCreateQueue}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          <Plus size={18} />
          Create Queue
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {statistics.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            background={stat.background}
          />
        ))}
      </div>

      {/* Activity Chart + Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-w-0 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900">
            Queue Activity
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Queue activity throughout the day
          </p>

          <div className="mt-6">
            <QueueActivityChart />
          </div>

          <p className="mt-2 text-xs text-slate-400">
            Activity is calculated from queue token records.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Quick Actions
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Manage your queues faster.
          </p>

          <button
            type="button"
            onClick={onCreateQueue}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-50 px-4 py-4 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
          >
            <Plus size={18} />
            Create New Queue
          </button>
        </div>
      </div>

      {/* Active Queue Overview */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Active Queues
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your currently active service queues.
            </p>
          </div>

          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            {activeQueues} Active
          </span>
        </div>

        {localActiveQueues === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-10 text-center">
            <ListOrdered
              size={36}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 font-medium text-slate-700">
              No active queues yet
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Create a queue to start managing customers.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {queues
              .filter(
                (queue) => queue.status === "Active"
              )
              .map((queue) => (
                <div
                  key={queue.id}
                  className="rounded-xl border border-slate-200 p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-slate-900">
                      {queue.name}
                    </h3>

                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Active
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm">
                    <div>
                      <p className="text-slate-400">
                        Waiting
                      </p>

                      <p className="mt-1 text-xl font-bold text-slate-900">
                        {queue.waitingTokens}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-slate-400">
                        Now Serving
                      </p>

                      <p className="mt-1 text-lg font-bold text-indigo-600">
                        {queue.nowServing
                          ? `#${queue.nowServing}`
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
