import React from "react";
import { FaSearch } from "react-icons/fa";

type ExpenseFilterProps = {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  fromDate: Date;
  onFromDateChange: (date: Date) => void;
  toDate: Date;
  onToDateChange: (date: Date) => void;
};

const quickRanges = [
  {
    label: "Today",
    getRange: () => {
      const from = new Date();
      from.setHours(0, 0, 0, 0);
      const to = new Date();
      to.setHours(23, 59, 59, 999);
      return { from, to };
    },
  },
  {
    label: "This Week",
    getRange: () => {
      const now = new Date();
      const from = new Date(now);
      from.setDate(now.getDate() - now.getDay());
      from.setHours(0, 0, 0, 0);
      const to = new Date();
      to.setHours(23, 59, 59, 999);
      return { from, to };
    },
  },
  {
    label: "This Month",
    getRange: () => {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      from.setHours(0, 0, 0, 0);
      const to = new Date();
      to.setHours(23, 59, 59, 999);
      return { from, to };
    },
  },
];

const inputClass =
  "border border-gray-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 bg-white";

const ExpenseFilter: React.FC<ExpenseFilterProps> = ({
  searchTerm,
  onSearchTermChange,
  fromDate,
  onFromDateChange,
  toDate,
  onToDateChange,
}) => {
  const isActiveRange = (label: string) => {
    const range = quickRanges.find((r) => r.label === label)?.getRange();
    if (!range) return false;
    return (
      fromDate.toDateString() === range.from.toDateString() &&
      toDate.toDateString() === range.to.toDateString()
    );
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
      {/* Search */}
      <div className="relative flex-1 min-w-[180px]">
        <FaSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400 text-xs" />
        <input
          type="text"
          placeholder="Search expenses..."
          className={`${inputClass} pl-8 w-full`}
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
        />
      </div>

      {/* Quick ranges */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
        {quickRanges.map((r) => (
          <button
            key={r.label}
            onClick={() => {
              const { from, to } = r.getRange();
              onFromDateChange(from);
              onToDateChange(to);
            }}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              isActiveRange(r.label)
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-200"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Date range inputs */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500">From</span>
        <input
          type="date"
          className={inputClass}
          value={fromDate.toLocaleDateString("en-CA")}
          onChange={(e) => {
            const [year, month, day] = e.target.value.split("-").map(Number);
            const date = new Date(year, month - 1, day);
            date.setHours(0, 0, 0, 0);
            onFromDateChange(date);
            if (date > toDate) {
              const newTo = new Date(date);
              newTo.setHours(23, 59, 59, 999);
              onToDateChange(newTo);
            }
          }}
        />
        <span className="text-xs font-medium text-gray-500">To</span>
        <input
          type="date"
          className={inputClass}
          value={toDate.toLocaleDateString("en-CA")}
          max={new Date().toLocaleDateString("en-CA")}
          onChange={(e) => {
            const [year, month, day] = e.target.value.split("-").map(Number);
            const date = new Date(year, month - 1, day);
            date.setHours(23, 59, 59, 999);
            onToDateChange(date);
          }}
        />
      </div>
    </div>
  );
};

export default ExpenseFilter;
