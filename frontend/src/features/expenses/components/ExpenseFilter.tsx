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

const ExpenseFilter: React.FC<ExpenseFilterProps> = ({
  searchTerm,
  onSearchTermChange,
  fromDate,
  onFromDateChange,
  toDate,
  onToDateChange,
}) => {
  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <FaSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search expenses..."
          className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
        />
      </div>
      <div className="relative">
        <label className="text-sm font-medium text-gray-700 mr-2">From</label>
        <input
          type="date"
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={fromDate.toLocaleDateString("en-CA")}
          onChange={(e) => {
            const [year, month, day] = e.target.value.split("-").map(Number);
            const date = new Date(year, month - 1, day);
            date.setHours(0, 0, 0, 0);
            onFromDateChange(date);
            if (date > toDate) {
              const newToDate = new Date(date);
              newToDate.setHours(23, 59, 59, 999);
              onToDateChange(newToDate);
            }
          }}
        />
      </div>
      <div className="relative">
        <label className="text-sm font-medium text-gray-700 mr-2">To</label>
        <input
          type="date"
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
