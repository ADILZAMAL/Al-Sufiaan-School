import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface Expense {
  amount: number;
  createdAt: Date;
  expenseCategory: {
    id: number;
    name: string;
  };
}

interface Props {
  expenses: Expense[];
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#f97316"];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

// ─── Custom Tooltip ──────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 min-w-[160px]">
      {label && <p className="text-xs font-semibold text-gray-500 mb-2">{label}</p>}
      {payload.map((entry: any) => (
        <div key={entry.dataKey ?? entry.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-xs text-gray-600">
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ background: entry.fill ?? entry.stroke ?? entry.color }}
            />
            {entry.name}
          </span>
          <span className="text-xs font-semibold text-gray-800">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Empty Chart Placeholder ─────────────────────────────────────────────────
const EmptyChart = ({ height = 220 }: { height?: number }) => (
  <div
    className="flex items-center justify-center text-xs text-gray-400"
    style={{ height }}
  >
    No data for selected range
  </div>
);

// ─── Pie Chart ───────────────────────────────────────────────────────────────
export const ExpenseByCategoryPieChart: React.FC<Props> = ({ expenses }) => {
  const data = expenses.reduce((acc, expense) => {
    const name = expense.expenseCategory.name;
    const existing = acc.find((item) => item.name === name);
    if (existing) {
      existing.value += Number(expense.amount);
    } else {
      acc.push({ name, value: Number(expense.amount) });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  if (!data.length) return <EmptyChart />;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart margin={{ top: 10, bottom: 0, left: 0, right: 0 }}>
        <Pie
          data={data}
          cx="50%"
          cy="46%"
          outerRadius={75}
          paddingAngle={3}
          dataKey="value"
          nameKey="name"
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          iconType="circle"
          iconSize={8}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

// ─── Bar Chart ───────────────────────────────────────────────────────────────
export const TotalExpensesByCategoryBarChart: React.FC<Props> = ({ expenses }) => {
  const data = expenses.reduce((acc, expense) => {
    const name = expense.expenseCategory.name;
    const existing = acc.find((item) => item.name === name);
    if (existing) {
      existing.total += Number(expense.amount);
    } else {
      acc.push({ name, total: Number(expense.amount) });
    }
    return acc;
  }, [] as { name: string; total: number }[]);

  if (!data.length) return <EmptyChart />;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "#6b7280" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => {
            if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
            if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
            return `₹${v}`;
          }}
          tick={{ fontSize: 11, fill: "#6b7280" }}
          axisLine={false}
          tickLine={false}
          width={50}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f9fafb" }} />
        <Bar dataKey="total" name="Total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

// ─── Line Chart ──────────────────────────────────────────────────────────────
export const ExpenseTrendLineChart: React.FC<Props> = ({ expenses }) => {
  const sorted = [...expenses].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const data = sorted.reduce((acc, expense) => {
    const date = new Date(expense.createdAt).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      timeZone: "Asia/Kolkata",
    });
    const existing = acc.find((item) => item.date === date);
    if (existing) {
      existing.total += Number(expense.amount);
    } else {
      acc.push({ date, total: Number(expense.amount) });
    }
    return acc;
  }, [] as { date: string; total: number }[]);

  if (!data.length) return <EmptyChart />;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#6b7280" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => {
            if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
            return `₹${v}`;
          }}
          tick={{ fontSize: 11, fill: "#6b7280" }}
          axisLine={false}
          tickLine={false}
          width={50}
        />
        <Tooltip content={<ChartTooltip />} />
        <Line
          type="monotone"
          dataKey="total"
          name="Total"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "#3b82f6" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
