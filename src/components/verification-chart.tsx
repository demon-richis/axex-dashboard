import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type VerificationTrendPoint = {
  day: string;
  label: string;
  success: number;
  failed: number;
  quarantined: number;
  expired: number;
  in_progress: number;
};

export function VerificationChart({ data }: { data: VerificationTrendPoint[] }) {
  return (
    <section className="card verification-chart" aria-labelledby="verification-trend-title">
      <header className="verification-chart-heading">
        <div>
          <p className="eyebrow">SEVEN-DAY ACTIVITY</p>
          <h2 id="verification-trend-title">Verification trend</h2>
          <p className="muted">Daily outcomes recorded by Axex.</p>
        </div>
        <span className="chart-period">Last 7 days</span>
      </header>
      <div className="verification-chart-body">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: -18 }}>
            <CartesianGrid
              stroke="rgba(255,255,255,0.075)"
              strokeDasharray="3 5"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9e938c", fontSize: 10 }}
              minTickGap={12}
            />
            <YAxis
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9e938c", fontSize: 10 }}
              width={36}
            />
            <Tooltip
              cursor={{ stroke: "rgba(255,178,30,0.25)", strokeDasharray: "3 3" }}
              contentStyle={{
                border: "1px solid rgba(255,178,30,0.22)",
                borderRadius: 10,
                background: "#171513",
                color: "#f5eee8",
                fontSize: 11,
              }}
              labelStyle={{ color: "#d8c8bb", marginBottom: 5 }}
              itemStyle={{ padding: 1 }}
            />
            <Legend
              verticalAlign="bottom"
              height={30}
              iconType="circle"
              iconSize={7}
              wrapperStyle={{ color: "#bcb1a8", fontSize: 10 }}
            />
            <Line type="monotone" dataKey="success" name="Successful" stroke="#84cc16" strokeWidth={2.4} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
            <Line type="monotone" dataKey="failed" name="Failed" stroke="#f87171" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
            <Line type="monotone" dataKey="quarantined" name="Quarantined" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
            <Line type="monotone" dataKey="expired" name="Expired" stroke="#a78bfa" strokeWidth={1.8} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
            <Line type="monotone" dataKey="in_progress" name="In progress" stroke="#60a5fa" strokeWidth={1.8} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
