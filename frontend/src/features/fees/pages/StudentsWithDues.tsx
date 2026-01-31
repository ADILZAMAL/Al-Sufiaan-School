import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { fetchStudentsWithDues, StudentWithDue } from '../api/studentsWithDues';
import { FiUser, FiDollarSign, FiCalendar, FiAlertCircle } from 'react-icons/fi';

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const StudentsWithDues: React.FC = () => {
  const navigate = useNavigate();
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentYear = now.getFullYear();

  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  const { data: students = [], isLoading, error, refetch } = useQuery({
    queryKey: ['studentsWithDues', selectedMonth, selectedYear],
    queryFn: () => fetchStudentsWithDues(selectedMonth, selectedYear),
    enabled: !!selectedMonth && !!selectedYear,
  });

  const handleRowClick = (studentId: number) => {
    navigate(`/dashboard/students/${studentId}`);
  };

  const handleYearChange = (newYear: number) => {
    setSelectedYear(newYear);
    // If the selected year is current year, ensure month is not in the future
    if (newYear === currentYear && selectedMonth > currentMonth) {
      setSelectedMonth(currentMonth);
    }
  };

  const handleMonthChange = (newMonth: number) => {
    // Validate: if current year, don't allow future months
    if (selectedYear === currentYear && newMonth > currentMonth) {
      return; // Don't update if trying to select a future month
    }
    setSelectedMonth(newMonth);
  };

  // Generate year options (past 5 years to current year)
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i).reverse();

  // Generate month options based on selected year
  const getAvailableMonths = () => {
    if (selectedYear === currentYear) {
      // Only show months up to current month
      return MONTH_NAMES.slice(1, currentMonth + 1).map((month, index) => ({
        value: index + 1,
        label: month
      }));
    } else {
      // Show all months for past years
      return MONTH_NAMES.slice(1).map((month, index) => ({
        value: index + 1,
        label: month
      }));
    }
  };

  const availableMonths = getAvailableMonths();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 shadow-lg">
        <div className="px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-lg">
                <FiAlertCircle className="text-white text-2xl" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Students with Dues</h1>
                <p className="text-red-100 mt-1">View students who have pending fee payments for a specific month</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Month/Year Selector */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FiCalendar className="text-gray-500" />
              <label className="text-sm font-medium text-gray-700">Select Month:</label>
            </div>
            <select
              value={selectedMonth}
              onChange={(e) => {
                handleMonthChange(parseInt(e.target.value));
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              {availableMonths.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
            <label className="text-sm font-medium text-gray-700">Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => {
                handleYearChange(parseInt(e.target.value));
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <div className="ml-auto text-sm text-gray-600">
              Showing dues for: <span className="font-semibold text-gray-900">
                {MONTH_NAMES[selectedMonth]} {selectedYear}
              </span>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading === true && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading students with dues...</p>
          </div>
        )}

        {/* Error State */}
        {error !== null && error !== undefined && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="bg-red-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <FiAlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading students</h3>
            <p className="text-gray-600 mb-4">{error instanceof Error ? error.message : 'An error occurred'}</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && students.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="bg-green-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <FiDollarSign className="h-12 w-12 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Students with Dues</h3>
            <p className="text-gray-600 mb-6">
              All students have cleared their fees for {MONTH_NAMES[selectedMonth]} {selectedYear}.
            </p>
          </div>
        )}

        {/* Students List */}
        {!isLoading && !error && students.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {students.length} {students.length === 1 ? 'Student' : 'Students'} with Dues
                </h2>
                <div className="text-sm text-gray-600">
                  Total Due: <span className="font-semibold text-red-600">
                    {formatCurrency(students.reduce((sum, s) => sum + s.dueAmount, 0))}
                  </span>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Admission Number
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Payable
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paid Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((studentWithDue: StudentWithDue) => (
                    <tr
                      key={studentWithDue.studentId}
                      onClick={() => handleRowClick(studentWithDue.studentId)}
                      className="hover:bg-red-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {studentWithDue.student.studentPhoto ? (
                            <img
                              src={studentWithDue.student.studentPhoto}
                              alt={`${studentWithDue.student.firstName} ${studentWithDue.student.lastName}`}
                              className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
                            />
                          ) : (
                            <div className="flex-shrink-0 h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                              <FiUser className="h-5 w-5 text-red-600" />
                            </div>
                          )}
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {studentWithDue.student.firstName} {studentWithDue.student.lastName}
                            </div>
                            {studentWithDue.student.email && (
                              <div className="text-xs text-gray-500">{studentWithDue.student.email}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{studentWithDue.student.admissionNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {studentWithDue.student.class?.name || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(studentWithDue.totalPayableAmount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-600">
                          {formatCurrency(studentWithDue.paidAmount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-red-600">
                          {formatCurrency(studentWithDue.dueAmount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          studentWithDue.status === 'PAID'
                            ? 'bg-green-100 text-green-800'
                            : studentWithDue.status === 'PARTIAL'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {studentWithDue.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentsWithDues;
