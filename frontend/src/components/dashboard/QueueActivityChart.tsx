
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { useQueue } from "../../context/QueueContext";
import type { Token } from "../../types/queue";

// Extended token type with queueId
type QueueToken = Token & {
  queueId: string;
};

// Generate hourly queue statistics
function generateChartData(tokens: QueueToken[]) {
  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  // Show hourly values from 9 AM to 8 PM
  const hours = Array.from(
    { length: 12 },
    (_, index) => index + 9
  );

  return hours.map((hour) => {
    const hourStart = new Date(todayStart);
    hourStart.setHours(hour, 0, 0, 0);

    const hourEnd = new Date(todayStart);
    hourEnd.setHours(hour + 1, 0, 0, 0);

    // Count customers who were waiting at the END
    // of this hour (not simply customers added).
    const waitingCount = tokens.filter((token) => {
      const createdAt = new Date(token.createdAt).getTime();

      if (!Number.isFinite(createdAt)) return false;

      const servedAt = token.servedAt
        ? new Date(token.servedAt).getTime()
        : null;

      // Existing Token type has no cancelledAt timestamp.
      // Cancelled tokens cannot be reconstructed accurately.
      if (token.status === "cancelled") return false;

      const startedBeforeEnd = createdAt < hourEnd.getTime();

      const notYetServed =
        servedAt === null || servedAt >= hourEnd.getTime();

      return startedBeforeEnd && notYetServed;
    }).length;

    return {
      time: hourStart.toLocaleTimeString("en-IN", {
        hour: "numeric",
        hour12: true,
      }),
      waiting: waitingCount,
    };

}).filter((_, index) => {
  // Hide future hours
  const hour = hours[index];
  return hour <= now.getHours();
});

  
}

function QueueActivityChart() {
  const { tokens } = useQueue();

  const chartData = generateChartData(tokens);

  const hasData = chartData.some(
    (point) => point.waiting > 0
  );

  if (!hasData) {
    return (
      <div className="flex h-72 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50">
        <p className="font-medium text-slate-600">
          No queue activity yet
        </p>

        <p className="mt-2 text-center text-sm text-slate-400">
          Add customers to start viewing queue trends.
        </p>
      </div>
    );
  }

  return (
    <div className="h-72 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 10,
            right: 15,
            left: -20,
            bottom: 5,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e2e8f0"
            vertical={false}
          />

          <XAxis
            dataKey="time"
            tickLine={false}
            axisLine={false}
            tick={{
              fill: "#64748b",
              fontSize: 12,
            }}
          />

          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tick={{
              fill: "#64748b",
              fontSize: 12,
            }}
          />

          <Tooltip
            formatter={(value) => [
              value,
              "Waiting Tokens",
            ]}
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              backgroundColor: "#ffffff",
            }}
          />

          <Line
            type="monotone"
            dataKey="waiting"
            name="Waiting Tokens"
            stroke="#6366f1"
            strokeWidth={3}
            dot={{
              r: 4,
              fill: "#6366f1",
            }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default QueueActivityChart;
