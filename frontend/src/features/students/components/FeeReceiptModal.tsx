import React from 'react';
import { FiX, FiPrinter } from 'react-icons/fi';
import { School } from '../../../api/school';

interface FeeItem {
  feeType: string;
  amount: number;
}

interface PaymentDetail {
  id: number;
  amountPaid: number;
  paymentDate: Date;
  paymentMode: string;
  referenceNumber: string | null;
  remarks: string | null;
  receivedBy: string | null;
}

interface StudentInfo {
  firstName: string;
  lastName: string;
  admissionNumber: string;
  rollNumber?: string | null;
  className: string;
  sectionName: string;
  schoolId: number;
  fatherName?: string;
}

interface FeeReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PaymentDetail;
  month: string;
  feeItems: FeeItem[] | null;
  totalConfiguredAmount?: number;
  totalAdjustment?: number;
  totalPayableAmount: number;
  paidAmount: number;
  discountReason?: string | null;
  student: StudentInfo;
  school: School;
  allPayments: PaymentDetail[];
}

const FeeReceiptModal: React.FC<FeeReceiptModalProps> = ({
  isOpen,
  onClose,
  payment,
  month,
  feeItems,
  totalConfiguredAmount,
  totalAdjustment,
  totalPayableAmount,
  paidAmount,
  discountReason,
  student,
  school,
  allPayments,
}) => {
  const handlePrint = () => {
    // Create a print-only window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print the receipt');
      return;
    }

    // Get receipt content
    const receiptContent = document.getElementById('receipt-print-area');
    if (!receiptContent) return;

    // Create print document
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fee Receipt #${payment.id}</title>
        <style>
          @page {
            size: A4;
            margin: 0;
          }
          * {
            box-sizing: border-box;
          }
          body {
            margin: 0;
            padding: 8mm 10mm;
            font-family: Arial, sans-serif;
            background: white;
          }
          .receipt {
            background: white;
            border: 1px solid #000;
            padding: 8px;
            margin-bottom: 5px;
            position: relative;
            page-break-inside: avoid;
          }
          .watermark {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: none;
            opacity: 0.08;
            z-index: 1;
          }
          .watermark img {
            width: 180px;
            height: 180px;
            object-fit: contain;
          }
          .text-center { text-align: center; }
          .text-left { text-align: left; }
          .text-right { text-align: right; }
          .uppercase { text-transform: uppercase; }
          .font-bold { font-weight: bold; }
          .text-sm { font-size: 10px; }
          .text-xs { font-size: 9px; }
          .text-lg { font-size: 12px; }
          .text-xl { font-size: 14px; }
          .mb-2 { margin-bottom: 2px; }
          .mb-4 { margin-bottom: 3px; }
          .mt-2 { margin-top: 2px; }
          .mt-4 { margin-top: 3px; }
          .mt-6 { margin-top: 5px; }
          .my-2 { margin-top: 2px; margin-bottom: 2px; }
          .my-4 { margin-top: 3px; margin-bottom: 3px; }
          .my-6 { margin-top: 5px; margin-bottom: 5px; }
          .my-20 { margin-top: 48px; margin-bottom: 48px; }
          .py-1 { padding-top: 1px; padding-bottom: 1px; }
          .py-2 { padding-top: 2px; padding-bottom: 2px; }
          .py-3 { padding-top: 3px; padding-bottom: 3px; }
          .py-4 { padding-top: 4px; padding-bottom: 4px; }
          .px-2 { padding-left: 4px; padding-right: 4px; }
          .px-3 { padding-left: 6px; padding-right: 6px; }
          .p-3 { padding: 4px; }
          .p-4 { padding: 5px; }
          .p-6 { padding: 8px; }
          .pb-1 { padding-bottom: 2px; }
          .pb-2 { padding-bottom: 4px; }
          .pb-4 { padding-bottom: 8px; }
          .pt-4 { padding-top: 8px; }
          .border { border: 1px solid #d1d5db; }
          .border-b { border-bottom: 1px solid #d1d5db; }
          .border-t { border-top: 1px solid #d1d5db; }
          .border-b-2 { border-bottom: 2px solid #1f2937; }
          .border-t-2 { border-top: 2px solid #9ca3af; }
          .border-gray-300 { border-color: #d1d5db; }
          .border-gray-400 { border-color: #9ca3af; }
          .border-blue-200 { border-color: #bfdbfe; }
          .border-gray-800 { border-color: #1f2937; }
          .rounded { border-radius: 4px; }
          .rounded-lg { border-radius: 8px; }
          .bg-gray-50 { background-color: #f9fafb; }
          .bg-gray-100 { background-color: #f3f4f6; }
          .bg-gray-300 { background-color: #9ca3af !important; }
          .bg-blue-50 { background-color: #eff6ff; }
          .grid { display: grid; }
          .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
          .gap-2 { gap: 2px; }
          .gap-4 { gap: 4px; }
          .gap-8 { gap: 8px; }
          .flex { display: flex !important; width: 100% !important; }
          .flex-1 { flex: 1 !important; }
          .text-center { text-align: center !important; }
          .text-right { text-align: right !important; }
          .items-center { align-items: center !important; }
          .justify-center { justify-content: center !important; }
          .justify-between { justify-content: space-between !important; }
          .text-center { text-align: center !important; }
          .relative { position: relative; }
          .z-10 { z-index: 10; }
          .table { width: 100%; border-collapse: collapse; }
          .w-full { width: 100%; }
          .h-16 { height: 40px; }
          .h-px { height: 1px; }
          .w-auto { width: auto; }
          .mr-2 { margin-right: 6px; }
          .mr-3 { margin-right: 8px; }
          .ml-2 { margin-left: 6px; }
          .mb-8 { margin-bottom: 20px; }
          .text-gray-900 { color: #111827; }
          .text-gray-600 { color: #4b5563; }
          .text-gray-500 { color: #6b7280; }
          .text-gray-700 { color: #374151; }
          .text-green-700 { color: #15803d; }
          .text-white { color: white; }
          .italic { font-style: italic; }
          .tracking-wider { letter-spacing: 0.05em; }
          .object-contain { object-fit: contain; }
          .inline-block { display: inline-block; }
          img { max-width: 100%; }
        </style>
      </head>
      <body>
        ${receiptContent.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  const formatDate = (date: Date): string => {
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getFeeItemLabel = (feeType: string): string => {
    const labels: { [key: string]: string } = {
      'TUITION_FEE': 'Tuition Fee',
      'HOSTEL_FEE': 'Hostel Fee',
      'TRANSPORT_FEE': 'Transport Fee',
      'ADMISSION_FEE': 'Admission Fee',
      'DAYBOARDING_FEE': 'Dayboarding Fee',
    };
    return labels[feeType] || feeType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay - hidden during print */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 print:hidden"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl print:shadow-none print:rounded-none">
          {/* Header - hidden during print */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 print:hidden">
            <h3 className="text-lg font-semibold text-gray-900">Fee Receipt</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrint}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiPrinter className="mr-2 h-4 w-4" />
                Print Receipt
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Receipt Container - Print Area */}
          <div className="p-4 print:p-0">
            <div id="receipt-print-area" className="print-container flex flex-col min-h-screen">
              {/* Receipt 1 - Parent Copy */}
              <Receipt
                payment={payment}
                month={month}
                feeItems={feeItems}
                totalConfiguredAmount={totalConfiguredAmount}
                totalAdjustment={totalAdjustment}
                totalPayableAmount={totalPayableAmount}
                paidAmount={paidAmount}
                discountReason={discountReason}
                student={student}
                school={school}
                copyLabel="Parent Copy"
                formatDate={formatDate}
                formatCurrency={formatCurrency}
                getFeeItemLabel={getFeeItemLabel}
                allPayments={allPayments}
              />

              {/* Spacer */}
              <div className="my-20"></div>

              {/* Receipt 2 - School Copy */}
              <Receipt
                payment={payment}
                month={month}
                feeItems={feeItems}
                totalConfiguredAmount={totalConfiguredAmount}
                totalAdjustment={totalAdjustment}
                totalPayableAmount={totalPayableAmount}
                paidAmount={paidAmount}
                discountReason={discountReason}
                student={student}
                school={school}
                copyLabel="School Copy"
                formatDate={formatDate}
                formatCurrency={formatCurrency}
                getFeeItemLabel={getFeeItemLabel}
                allPayments={allPayments}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 12mm;
          }
          
          /* Hide everything except receipt */
          body > *:not([id*="receipt"]) {
            display: none !important;
          }
          
          body > div:not(.print-container) {
            display: none !important;
          }
          
          /* Show only the receipt modal content */
          .fixed.inset-0 {
            position: static !important;
            background: white !important;
            display: block !important;
          }
          
          .fixed.inset-0 > *:not([id*="receipt"]) {
            display: none !important;
          }
          
          .inline-block {
            display: block !important;
            width: 100% !important;
            max-width: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
          }
          
          .inline-block > *:not([id*="receipt"]) {
            display: none !important;
          }
          
          /* Show receipt container */
          #receipt-print-area {
            background: white !important;
            padding: 5px 0 !important;
            margin: 0 !important;
            display: flex !important;
            flex-direction: column !important;
            min-height: calc(100vh - 20mm) !important;
          }
          
          /* Style receipts for print */
          .receipt {
            background: white !important;
            padding: 4px !important;
            margin-bottom: 4px !important;
            margin-top: 4px !important;
            position: relative !important;
            page-break-inside: avoid !important;
          }
          
          .my-8 {
            margin-top: 15px !important;
            margin-bottom: 15px !important;
          }
          
          .watermark {
            opacity: 0.05 !important;
            z-index: 1 !important;
          }
          
          /* Hide scrollbars */
          ::-webkit-scrollbar {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

interface ReceiptProps {
  payment: PaymentDetail;
  month: string;
  feeItems: FeeItem[] | null;
  totalConfiguredAmount?: number;
  totalAdjustment?: number;
  totalPayableAmount: number;
  paidAmount: number;
  discountReason?: string | null;
  student: StudentInfo;
  school: School;
  copyLabel: string;
  formatDate: (date: Date) => string;
  formatCurrency: (amount: number) => string;
  getFeeItemLabel: (feeType: string) => string;
  allPayments: PaymentDetail[];
}

const Receipt: React.FC<ReceiptProps> = ({
  payment,
  month,
  feeItems,
  totalConfiguredAmount,
  totalAdjustment,
  totalPayableAmount,
  paidAmount,
  discountReason,
  student,
  school,
  copyLabel,
  formatDate,
  formatCurrency,
  getFeeItemLabel,
  allPayments,
}) => {
  // Calculate total paid and due amount
  const totalPaid = allPayments.reduce((sum, p) => sum + p.amountPaid, 0);
  const dueAmount = totalPayableAmount - totalPaid;
  return (
    <div className="receipt relative bg-white border border-gray-300 rounded-lg p-4 shadow-md">
      {/* Watermark */}
      <div className="watermark absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
        <img
          src="/img/school-logo.svg"
          alt="Watermark"
          className="w-64 h-64 object-contain"
        />
      </div>

      {/* Header */}
      <div className="relative z-10 border-b-2 border-gray-800 pb-2 mb-2">
        <div className="flex items-center justify-center gap-4">
          <img
            src="/img/school-logo.svg"
            alt="School Logo"
            className="h-16 w-auto"
          />
          <div className="text-xs text-left">
            <h1 className="text-lg font-bold text-gray-900 uppercase mb-1">{school.name}</h1>
            <p className="text-gray-600 mb-1">{school.city}, {school.district}, {school.state} - {school.pincode}</p>
            <p className="text-gray-600">Phone: {school.mobile} | Email: {school.email}</p>
          </div>
        </div>
      </div>

      {/* Receipt Info - Combined */}
      <div className="relative z-10 text-sm mb-4 p-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex-1">
            <span className="text-gray-500">Receipt No:</span>
            <span className="font-semibold text-gray-900 ml-1">#{payment.id}</span>
          </div>
          <div className="flex-1 text-center">
            <span className="font-bold text-gray-900 uppercase tracking-wide">Fee Receipt</span>
            <span className="text-gray-600 ml-1">({copyLabel})</span>
          </div>
          <div className="flex-1 text-right">
            <span className="text-gray-500">Date:</span>
            <span className="font-semibold text-gray-900 ml-1">{formatDate(payment.paymentDate)}</span>
          </div>
        </div>
      </div>

      {/* Student Details */}
      <div className="border relative z-10 bg-gray-50/50 rounded-lg p-3 mb-4">
        <h3 className="text-sm font-bold text-gray-900 mb-2 uppercase border-b border-gray-300 pb-1">
          Student Details
        </h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-500">Name:</span>
            <span className="ml-2 font-medium text-gray-900">
              {student.firstName} {student.lastName}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Father's Name:</span>
            <span className="ml-2 font-medium text-gray-900">{student.fatherName || 'N/A'}</span>
          </div>
          <div>
            <span className="text-gray-500">Admission No:</span>
            <span className="ml-2 font-medium text-gray-900">{student.admissionNumber}</span>
          </div>
          <div>
            <span className="text-gray-500">Class:</span>
            <span className="ml-2 font-medium text-gray-900">
              {student.className} - {student.sectionName}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Roll No:</span>
            <span className="ml-2 font-medium text-gray-900">{student.rollNumber || 'N/A'}</span>
          </div>
          <div className="col-span-2">
            <span className="text-gray-500">Fee Month:</span>
            <span className="ml-2 font-bold text-gray-900">{month}</span>
          </div>
        </div>
      </div>

      {/* Fee Breakdown */}
      <div className="relative z-10 mb-4">
        <h3 className="text-sm font-bold text-gray-900 mb-2 uppercase border-b border-gray-300 pb-1">
          Fee Breakdown
        </h3>
        <div className="border border-gray-300 rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Description</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-700">Amount</th>
              </tr>
            </thead>
            <tbody>
              {feeItems && feeItems.length > 0 ? (
                feeItems.map((item, index) => (
                  <tr key={index} className="border-t border-gray-200">
                    <td className="px-3 py-2 text-gray-900">{getFeeItemLabel(item.feeType)}</td>
                    <td className="px-3 py-2 text-right text-gray-900">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-3 py-2 text-gray-500 col-span-2">No fee items</td>
                </tr>
              )}
              {totalConfiguredAmount && (
                <tr className="border-t border-gray-200">
                  <td className="px-3 py-2 font-bold text-gray-900">Total Amount</td>
                  <td className="px-3 py-2 text-right font-bold text-gray-900">
                    {formatCurrency(totalConfiguredAmount)}
                  </td>
                </tr>
              )}
              {totalAdjustment !== undefined && totalAdjustment !== null && totalAdjustment > 0 && (
                <tr className="border-t border-gray-200">
                  <td className="px-3 py-2 text-gray-900 font-medium">
                    Discount{discountReason ? ` (${discountReason})` : ''}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-900 font-medium">
                    -{formatCurrency(totalAdjustment)}
                  </td>
                </tr>
              )}
              <tr className="border-t-2 border-gray-400 bg-gray-50/50">
                <td className="px-3 py-2 font-bold text-gray-900">Net Payable</td>
                <td className="px-3 py-2 text-right font-bold text-gray-900">
                  {formatCurrency(totalPayableAmount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Details */}
      <div className="relative z-10 bg-gray-50/50 rounded-lg p-3 mb-4">
        <h3 className="text-sm font-bold text-gray-900 mb-2 uppercase border-b border-blue-200 pb-1">
          Payment Details
        </h3>
        
        {/* Payment History Table */}
        <div className="mb-2">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="pb-1 font-medium">#</th>
                <th className="pb-1 font-medium">Date</th>
                <th className="pb-1 font-medium">Amount</th>
                <th className="pb-1 font-medium">Mode</th>
                <th className="pb-1 font-medium">Received By</th>
              </tr>
            </thead>
            <tbody className="text-gray-900">
              {allPayments.map((p, index) => (
                <tr key={p.id} className={index === allPayments.length - 1 ? '' : 'border-b border-gray-200'}>
                  <td className="py-1">{index + 1}</td>
                  <td className="py-1">{formatDate(p.paymentDate)}</td>
                  <td className="py-1">{formatCurrency(p.amountPaid)}</td>
                  <td className="py-1">{p.paymentMode}</td>
                  <td className="py-1">{p.receivedBy || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total and Due Amount */}
        <div className="border-t border-gray-300 pt-2 mt-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600 font-medium">Total Paid:</span>
            <span className="font-bold text-green-700">{formatCurrency(totalPaid)}</span>
          </div>
          {dueAmount > 0 && (
            <div className="flex justify-between items-center text-sm mt-1">
              <span className="text-gray-600 font-medium">Due Amount:</span>
              <span className="font-bold text-red-600">{formatCurrency(dueAmount)}</span>
            </div>
          )}
          {dueAmount === 0 && (
            <div className="flex justify-between items-center text-sm mt-1">
              <span className="text-gray-600 font-medium">Status:</span>
              <span className="font-bold text-green-600">Fully Paid</span>
            </div>
          )}
        </div>
      </div>

      {/* Signature Section */}
      <div className="relative z-10">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="text-sm text-gray-600 mb-8">Receiver Signature</p>
            {/* <div className="border-b border-gray-400"></div> */}
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 mb-8">School Stamp</p>
            {/* <div className="border-b border-gray-400"></div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeeReceiptModal;
