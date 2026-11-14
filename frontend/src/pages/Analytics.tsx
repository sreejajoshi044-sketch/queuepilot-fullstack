
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Users,
} from "lucide-react";

import { useQueue } from "../context/QueueContext";
import QueueActivityChart from "../components/dashboard/QueueActivityChart";

type AnalyticsData = {
  activeQueues?: number;
  totalQueues?: number;
  waitingCustomers?: number;
  waitingTokens?: number;
  servedToday?: number;
  averageWaitMinutes?: number;
  averageWaitTime?: number;
};

type AnalyticsResponse = {
  success: boolean;
  message?: string;
  data?: AnalyticsData;
};

const API_URL = "http://localhost:5000";

function Analytics() {
  const { queues, tokens } = useQueue();

  const [analytics, setAnalytics] =
    useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadAnalytics = async () => {
      const token = sessionStorage.getItem(
        "queueflow_token"
      );

      if (!token) {
        setError("Please log in again.");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_URL}/api/analytics/dashboard`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const result: AnalyticsResponse =
          await response.json();

        if (
          !response.ok ||
          !result.success ||
          !result.data
        ) {
          throw new Error(
            result.message || "Could not load analytics."
          );
        }

        if (!cancelled) {
          setAnalytics(result.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Analytics request failed."
          );
          setAnalytics(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadAnalytics();

    return () => {
      cancelled = true;
    };
  }, [refreshKey, queues, tokens]);

  // Queue and token records are loaded from PostgreSQL
  // by QueueContext.
  const summary = useMemo(() => {
    const waiting = tokens.filter(
      (token) => token.status === "waiting"
    ).length;

    const completed = tokens.filter(
      (token) => token.status === "completed"
    ).length;

    const serving = tokens.filter(
      (token) => token.status === "serving"
    ).length;

    const cancelled = tokens.filter(
      (token) => token.status === "cancelled"
    ).length;

    const today = new Date().toDateString();

    const servedToday = tokens.filter(
      (token) =>
        token.status === "completed" &&
        Boolean(token.completedAt) &&
        new Date(
          token.completedAt as string
        ).toDateString() === today
    ).length;

    const served = tokens.filter(
      (token) => Boolean(token.servedAt)
    );

    const totalMinutes = served.reduce(
      (sum, token) => {
        if (!token.servedAt) return sum;

        const minutes =
          (new Date(token.servedAt).getTime() -
            new Date(token.createdAt).getTime()) /
          60000;

        return sum + (
          Number.isFinite(minutes)
            ? Math.max(0, minutes)
            : 0
        );
      },
      0
    );

    return {
      waiting,
      completed,
      serving,
      cancelled,
      servedToday,
      averageWait:
        served.length > 0
          ? totalMinutes / served.length
          : 0,
    };
  }, [tokens]);

  const totalQueues =
    analytics?.totalQueues ?? queues.length;

  const waiting =
    analytics?.waitingCustomers ??
    analytics?.waitingTokens ??
    summary.waiting;

  const servedToday =
    analytics?.servedToday ?? summary.servedToday;

  const averageWait =
    analytics?.averageWaitMinutes ??
    analytics?.averageWaitTime ??
    summary.averageWait;

  const queueRows = queues.map((queue) => {
    const items = tokens.filter(
      (token) => token.queueId === queue.id
    );

    return {
      ...queue,
      total: items.length,
      waiting: items.filter(
        (token) => token.status === "waiting"
      ).length,
      completed: items.filter(
        (token) => token.status === "completed"
      ).length,
      cancelled: items.filter(
        (token) => token.status === "cancelled"
      ).length,
    };
  });

  const cards = [
    {
      title: "Total Queues",
      value: totalQueues,
      icon: BarChart3,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      title: "Waiting Customers",
      value: waiting,
      icon: Users,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      title: "Served Today",
      value: servedToday,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Average Wait",
      value: `${Math.round(averageWait)} min`,
      icon: Clock3,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
  ];

  const maximumQueueSize = Math.max(
    1,
    ...queueRows.map((queue) => queue.total)
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Analytics
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Track queue activity and customer service
            performance.
          </p>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={() =>
            setRefreshKey((previous) => previous + 1)
          }
          className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-5 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
        >
          <RefreshCw
            size={17}
            className={loading ? "animate-spin" : ""}
          />
          Refresh Analytics
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
        >
          {error} Showing available queue records.
        </div>
      )}

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  {card.title}
                </p>

                <div
                  className={`rounded-xl p-3 ${card.bg}`}
                >
                  <Icon
                    size={20}
                    className={card.color}
                  />
                </div>
              </div>

              <h2 className="mt-4 text-3xl font-bold text-slate-900">
                {card.value}
              </h2>
            </div>
          );
        })}
      </div>

      {/* Activity Chart */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Activity
            size={22}
            className="text-indigo-600"
          />

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Queue Activity
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Activity based on stored customer tokens.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <QueueActivityChart />
        </div>
      </div>

      {/* Service Performance */}
      <div className="grid gap-5 sm:grid-cols-3">
        {[
          {
            label: "Currently Serving",
            value: summary.serving,
          },
          {
            label: "Total Completed",
            value: summary.completed,
          },
          {
            label: "Total Cancelled",
            value: summary.cancelled,
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
          >
            <p className="text-sm text-slate-500">
              {item.label}
            </p>

            <p className="mt-3 text-3xl font-bold text-slate-900">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* Queue-wise Analytics */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Queue-wise Performance
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Customer tokens grouped by queue.
        </p>

        {queueRows.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500">
            No queue records available.
          </p>
        ) : (
          <div className="mt-6 space-y-6">
            {queueRows.map((queue) => (
              <div key={queue.id}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-800">
                    {queue.name}
                  </p>

                  <p className="text-sm text-slate-500">
                    {queue.total} tokens
                  </p>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-indigo-500"
                    style={{
                      width: `${
                        (queue.total / maximumQueueSize) * 100
                      }%`,
                    }}
                  />
                </div>

                <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                  <span>Waiting: {queue.waiting}</span>
                  <span>Completed: {queue.completed}</span>
                  <span>Cancelled: {queue.cancelled}</span>
                  <span>Status: {queue.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Analytics;
