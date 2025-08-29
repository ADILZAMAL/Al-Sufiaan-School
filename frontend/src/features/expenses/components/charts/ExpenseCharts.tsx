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

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#AF19FF",
  "#FF1919",
];

export const ExpenseByCategoryPieChart: React.FC<Props> = ({ expenses }) => {
  const data = expenses.reduce((acc, expense) => {
    const categoryName = expense.expenseCategory.name;
    const category = acc.find((item) => item.name === categoryName);
    if (category) {
      category.value += Number(expense.amount);
    } else {
      acc.push({ name: categoryName, value: Number(expense.amount) });
    }
    return acc;
  }, [] as { name: string; value: number }[]);
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ percent }) => (percent ? `${(percent * 100).toFixed(0)}%` : "")}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export const TotalExpensesByCategoryBarChart: React.FC<Props> = ({
  expenses,
}) => {
  const data = expenses.reduce((acc, expense) => {
    const categoryName = expense.expenseCategory.name;
    const category = acc.find((item) => item.name === categoryName);
    if (category) {
      category.total += Number(expense.amount);
    } else {
      acc.push({ name: categoryName, total: Number(expense.amount) });
    }
    return acc;
  }, [] as { name: string; total: number }[]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="total" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export const ExpenseTrendLineChart: React.FC<Props> = ({ expenses }) => {
  const sortedExpenses = [...expenses].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const data = sortedExpenses.reduce((acc, expense) => {
    const date = new Date(expense.createdAt).toLocaleDateString();
    const entry = acc.find((item) => item.date === date);
    if (entry) {
      entry.total += Number(expense.amount);
    } else {
      acc.push({ date, total: Number(expense.amount) });
    }
    return acc;
  }, [] as { date: string; total: number }[]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="total" stroke="#8884d8" />
      </LineChart>
    </ResponsiveContainer>
  );
};
