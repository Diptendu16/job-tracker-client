import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { type AnalyticsData } from "../types/analytics";
import * as analyticsApi from "../api/analyticsApi";
import { MetricCard } from "../components/MetricCard";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  APPLIED: "#60a5fa",
  OA: "#facc15",
  INTERVIEW: "#c084fc",
  OFFER: "#4ade80",
  REJECTED: "#f87171",
};

export default function Analytics() {
  const { workspace } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (workspace) load();
  }, [workspace]);

  async function load() {
    if (!workspace) return;
    setLoading(true);
    setError("");
    try {
      const result = await analyticsApi.fetchAnalytics(workspace.id);
      setData(result);
    } catch {
      setError("Could not load analytics. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <Link to="/" className="text-blue-400 hover:underline text-sm">
          ← Back to Dashboard
        </Link>
      </div>

      {loading && <p className="text-gray-400">Loading analytics...</p>}

      {error && !loading && (
        <div className="bg-red-900/40 text-red-300 p-4 rounded">
          {error}{" "}
          <button onClick={load} className="underline ml-2">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && data && data.rates.total === 0 && (
        <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-400">
          No applications yet. Add your first application to see analytics here.
        </div>
      )}

      {!loading && !error && data && data.rates.total > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <MetricCard label="Total Applications" value={data.rates.total} />
            <MetricCard
              label="Response Rate"
              value={`${data.rates.responseRate}%`}
            />
            <MetricCard
              label="Reached Interview"
              value={`${data.rates.reachedInterviewRate}%`}
            />
            <MetricCard label="Offer Rate" value={`${data.rates.offerRate}%`} />
            <MetricCard
              label="Rejection Rate"
              value={`${data.rates.rejectionRate}%`}
            />
          </div>

          <div className="bg-gray-800 rounded-lg p-4 mb-8">
            <h2 className="font-semibold mb-4">Status Distribution</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.statusDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="status" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1f2937", border: "none" }}
                />
                <Bar dataKey="count">
                  {data.statusDistribution.map((entry) => (
                    <Cell
                      key={entry.status}
                      fill={STATUS_COLORS[entry.status]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="font-semibold mb-4">Applications Per Week</h2>
            {data.applicationsPerWeek.length === 0 ? (
              <p className="text-gray-400 text-sm">Not enough data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data.applicationsPerWeek}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="label" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "none",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#60a5fa"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}
    </div>
  );
}
