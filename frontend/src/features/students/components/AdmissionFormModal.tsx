import React from 'react';
import { FiX, FiPrinter } from 'react-icons/fi';
import { Student } from '../types';
import { School } from '../../../api/school';

interface AdmissionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  school: School;
}

const AdmissionFormModal: React.FC<AdmissionFormModalProps> = ({
  isOpen,
  onClose,
  student,
  school,
}) => {
  const formatDateOnly = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const handlePrint = () => {
    // Create a print-only window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print the admission form');
      return;
    }

    // Get admission form content
    const formContent = document.getElementById('admission-form-print-area');
    if (!formContent) return;

      // Create print document
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Admission Form - ${student.admissionNumber}</title>
        <style>
          @page {
            size: A4;
            margin: 8mm;
          }
          * {
            box-sizing: border-box;
          }
          body {
            margin: 0;
            padding: 8mm;
            font-family: Arial, Helvetica, sans-serif;
            background: white;
            color: #111827;
            font-size: 11px;
            line-height: 1.4;
          }
          .admission-form {
            background: white;
            border: 3px solid #1e40af;
            padding: 12px;
            margin-bottom: 6px;
            position: relative;
            page-break-inside: avoid;
            page-break-after: always;
          }
          .watermark {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: none;
            opacity: 0.15;
            z-index: 0;
          }
          .watermark img {
            width: 250px;
            height: 250px;
            object-fit: contain;
            opacity: 1 !important;
          }
          .relative { position: relative; }
          .z-10 { z-index: 10; }
          .flex { display: flex; }
          .items-center { align-items: center; }
          .justify-center { justify-content: center; }
          .justify-between { justify-content: space-between; }
          .flex-1 { flex: 1; }
          .grid { display: grid; }
          .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
          .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
          .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
          .gap-2 { gap: 4px; }
          .gap-3 { gap: 6px; }
          .gap-4 { gap: 8px; }
          .gap-6 { gap: 12px; }
          .text-center { text-align: center; }
          .text-left { text-align: left; }
          .text-right { text-align: right; }
          .uppercase { text-transform: uppercase; }
          .capitalize { text-transform: capitalize; }
          .font-bold { font-weight: bold; }
          .font-semibold { font-weight: 600; }
          .text-xs { font-size: 10px; }
          .text-sm { font-size: 11px; }
          .text-base { font-size: 12px; }
          .text-lg { font-size: 14px; }
          .text-xl { font-size: 18px; }
          .text-2xl { font-size: 22px; }
          .mb-1 { margin-bottom: 3px; }
          .mb-2 { margin-bottom: 5px; }
          .mb-3 { margin-bottom: 8px; }
          .mb-4 { margin-bottom: 10px; }
          .mb-6 { margin-bottom: 15px; }
          .mb-8 { margin-bottom: 20px; }
          .mt-2 { margin-top: 5px; }
          .mt-4 { margin-top: 10px; }
          .mt-6 { margin-top: 15px; }
          .my-4 { margin-top: 10px; margin-bottom: 10px; }
          .p-2 { padding: 4px; }
          .p-3 { padding: 6px; }
          .p-4 { padding: 8px; }
          .p-6 { padding: 12px; }
          .px-2 { padding-left: 4px; padding-right: 4px; }
          .px-3 { padding-left: 6px; padding-right: 6px; }
          .px-4 { padding-left: 8px; padding-right: 8px; }
          .py-1 { padding-top: 3px; padding-bottom: 3px; }
          .py-2 { padding-top: 5px; padding-bottom: 5px; }
          .py-3 { padding-top: 8px; padding-bottom: 8px; }
          .border { border: 1px solid #d1d5db; }
          .border-2 { border: 3px solid #1e40af; }
          .border-b { border-bottom: 1px solid #d1d5db; }
          .border-b-2 { border-bottom: 2px solid #1e40af; }
          .border-r { border-right: 1px solid #d1d5db; }
          .border-t { border-top: 1px solid #d1d5db; }
          .border-gray-300 { border-color: #d1d5db; }
          .border-blue-800 { border-color: #1e40af; }
          .border-blue-200 { border-color: #bfdbfe; }
          .border-blue-300 { border-color: #93c5fd; }
          .rounded { border-radius: 4px; }
          .rounded-lg { border-radius: 8px; }
          .bg-blue-50 { background-color: #eff6ff; }
          .bg-green-50 { background-color: #f0fdf4; }
          .bg-yellow-50 { background-color: #fefce8; }
          .bg-pink-50 { background-color: #fdf2f8; }
          .bg-gray-50 { background-color: #f9fafb; }
          .bg-white { background-color: white; }
          .text-gray-900 { color: #111827; }
          .text-gray-700 { color: #374151; }
          .text-gray-600 { color: #4b5563; }
          .text-gray-500 { color: #6b7280; }
          .text-blue-900 { color: #1e3a8a; }
          .text-blue-700 { color: #1d4ed8; }
          .text-blue-600 { color: #2563eb; }
          .text-green-700 { color: #15803d; }
          .h-24 { height: 64px; }
          .w-24 { width: 64px; }
          .h-28 { height: 72px; }
          .w-28 { width: 72px; }
          .h-36 { height: 92px; }
          .w-36 { width: 92px; }
          .h-32 { height: 85px; }
          .w-32 { width: 85px; }
          .h-40 { height: 105px; }
          .w-40 { width: 105px; }
          .w-auto { width: auto; }
          .object-cover { object-fit: cover; }
          .object-contain { object-fit: contain; }
          .rounded-full { border-radius: 9999px; }
          .rounded-lg { border-radius: 8px; }
          .shadow-md { box-shadow: none; }
          .inline-block { display: inline-block; }
          .w-full { width: 100%; }
          img { max-width: 100%; display: block; }
          .leading-tight { line-height: 1.3; }
          .leading-normal { line-height: 1.5; }
          img.shadow-md {
            box-shadow: none !important;
          }
          .bg-gradient-to-br {
            background: white !important;
            border: 2px solid #1e40af !important;
          }
          .break-before-page {
            break-before: page;
          }
        </style>
      </head>
      <body>
        ${formContent.innerHTML}
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
        <div className="inline-block w-full max-w-5xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl print:shadow-none print:rounded-none">
          {/* Header - hidden during print */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 print:hidden">
            <h3 className="text-lg font-semibold text-gray-900">Admission Form</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrint}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiPrinter className="mr-2 h-4 w-4" />
                Print Form
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Admission Form Container - Print Area */}
          <div className="p-4 print:p-0">
            <div id="admission-form-print-area" className="print-container flex flex-col min-h-screen">
              {/* Admission Form 1 - Parent Copy */}
              <AdmissionFormContent
                student={student}
                school={school}
                copyLabel="Parent Copy"
                formatDateOnly={formatDateOnly}
              />

              {/* Spacer */}
              <div className="my-20"></div>

              {/* Admission Form 2 - School Copy */}
              <AdmissionFormContent
                student={student}
                school={school}
                copyLabel="School Copy"
                formatDateOnly={formatDateOnly}
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
            margin: 10mm;
          }
          
          /* Hide everything except admission form */
          body > *:not([id*="admission-form"]) {
            display: none !important;
          }
          
          body > div:not(.print-container) {
            display: none !important;
          }
          
          .fixed.inset-0 {
            position: static !important;
            background: white !important;
            display: block !important;
          }
          
          .fixed.inset-0 > *:not([id*="admission-form"]) {
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
          
          .inline-block > *:not([id*="admission-form"]) {
            display: none !important;
          }
          
          #admission-form-print-area {
            background: white !important;
            padding: 5px 0 !important;
            margin: 0 !important;
            display: flex !important;
            flex-direction: column !important;
            min-height: calc(100vh - 20mm) !important;
          }
          
          .admission-form {
            background: white !important;
            padding: 10px !important;
            margin-bottom: 5px !important;
            margin-top: 5px !important;
            position: relative !important;
            page-break-inside: avoid !important;
            page-break-after: always !important;
          }
          
          .my-20 {
            margin-top: 15px !important;
            margin-bottom: 15px !important;
          }
          
          .watermark {
            opacity: 0.12 !important;
            z-index: 0 !important;
          }
          .watermark img {
            opacity: 1 !important;
          }
          
          ::-webkit-scrollbar {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

interface AdmissionFormContentProps {
  student: Student;
  school: School;
  copyLabel: string;
  formatDateOnly: (iso: string) => string;
}

const AdmissionFormContent: React.FC<AdmissionFormContentProps> = ({
  student,
  school,
  copyLabel,
  formatDateOnly,
}) => {
  return (
    <div className="admission-form relative bg-white border border-gray-400 rounded-lg p-4 shadow-md">
      {/* Header */}
      <div className="relative z-10 border-b border-gray-400 pb-3 mb-4">
        <div className="flex items-center justify-center gap-4">
          <img
            src="/img/school-logo.svg"
            alt="School Logo"
            className="h-16 w-auto"
          />
          <div className="text-xs text-center flex-1">
            <h1 className="text-2xl font-bold text-gray-900 uppercase mb-1 leading-tight">
              {school.name}
            </h1>
            <p className="text-gray-700 mb-1 text-sm">
              {school.city}, {school.district}, {school.state} - {school.pincode}
            </p>
            <p className="text-gray-600 text-xs">
              Phone: {school.mobile} | Email: {school.email}
            </p>
          </div>
        </div>
      </div>

      {/* Form Title */}
      <div className="relative z-10 text-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900 uppercase border-b border-gray-400 py-3 inline-block px-8">
          Admission Form ({copyLabel})
        </h2>
      </div>

      {/* Admission Number & Date */}
      <div className="relative z-10 mb-4 p-4 border border-gray-300 rounded-lg">
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center">
            <span className="font-semibold text-gray-900">Admission No:</span>
            <span className="ml-3 px-3 py-1 bg-gray-800 text-white rounded-md font-bold text-base">
              {student.admissionNumber}
            </span>
          </div>
          <div className="flex items-center">
            <span className="font-semibold text-gray-900">Admission Date:</span>
            <span className="ml-3 font-semibold text-gray-900">
              {formatDateOnly(student.admissionDate)}
            </span>
          </div>
        </div>
      </div>

      {/* Student Photo & Personal Info */}
      <div className="relative z-10 mb-4 border border-gray-300 rounded-lg p-4 bg-gray-50">
        <h3 className="text-base font-semibold text-gray-900 mb-3 uppercase border-b border-gray-400 pb-2">
          Student Information
        </h3>
        <div className="flex items-start gap-4">
          {/* Photo Section */}
          <div className="flex-shrink-0">
            <div className="flex flex-col items-center">
              {student.studentPhoto ? (
                <img
                  src={student.studentPhoto}
                  alt={`${student.firstName} ${student.lastName}`}
                  className="w-28 h-36 object-cover rounded-lg shadow-md"
                />
              ) : (
                <div className="w-28 h-36 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white text-3xl font-bold border-2 border-blue-800">
                  {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
                </div>
              )}
              {/* <p className="text-xs text-gray-600 mt-2 font-medium">Student Photo</p> */}
            </div>
          </div>

          {/* Personal Details */}
          <div className="flex-1">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex">
                <span className="font-semibold text-gray-600 w-32 flex-shrink-0">Name:</span>
                <span className="ml-2 font-semibold text-gray-900 capitalize">
                  {student.firstName} {student.lastName}
                </span>
              </div>
              <div className="flex">
                <span className="font-semibold text-gray-600 w-32 flex-shrink-0">Date of Birth:</span>
                <span className="ml-2 font-semibold text-gray-900">
                  {formatDateOnly(student.dateOfBirth)}
                </span>
              </div>
              <div className="flex">
                <span className="font-semibold text-gray-600 w-32 flex-shrink-0">Gender:</span>
                <span className="ml-2 font-semibold text-gray-900 capitalize">
                  {student.gender.toLowerCase()}
                </span>
              </div>
              <div className="flex">
                <span className="font-semibold text-gray-600 w-32 flex-shrink-0">Blood Group:</span>
                <span className="ml-2 font-semibold text-gray-900">{student.bloodGroup}</span>
              </div>
              <div className="flex">
                <span className="font-semibold text-gray-600 w-32 flex-shrink-0">Religion:</span>
                <span className="ml-2 font-semibold text-gray-900">{student.religion}</span>
              </div>
              <div className="flex">
                <span className="font-semibold text-gray-600 w-32 flex-shrink-0">Aadhaar Number:</span>
                <span className="ml-2 font-semibold text-gray-900">
                  {student.aadhaarNumber || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Academic Information */}
      <div className="relative z-10 mb-4 border border-gray-300 rounded-lg p-4 bg-gray-50">
        <h3 className="text-base font-semibold text-gray-900 mb-3 uppercase border-b border-gray-400 pb-2">
          Academic Information
        </h3>
        <div className="grid grid-cols-4 gap-3 text-sm">
          <div className="flex items-center">
            <span className="font-semibold text-gray-600">Class:</span>
            <span className="ml-2 font-semibold text-gray-900">
              {student.class.name}
            </span>
          </div>
          <div className="flex items-center">
            <span className="font-semibold text-gray-600">Section:</span>
            <span className="ml-2 font-semibold text-gray-900">
              {student.section.name}
            </span>
          </div>
          <div className="flex items-center">
            <span className="font-semibold text-gray-600">Roll Number:</span>
            <span className="ml-2 font-semibold text-gray-900">
              {student.rollNumber || 'N/A'}
            </span>
          </div>
          <div className="flex items-center">
            <span className="font-semibold text-gray-600">Academic Year:</span>
            <span className="ml-2 font-semibold text-gray-900">
              2024-2025
            </span>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="relative z-10 mb-4 border border-gray-300 rounded-lg p-4 bg-gray-50">
        <h3 className="text-base font-semibold text-gray-900 mb-3 uppercase border-b border-gray-400 pb-2">
          Contact Information
        </h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center">
            <span className="font-semibold text-gray-600 w-20">Phone:</span>
            <span className="ml-2 font-semibold text-gray-900">{student.phone}</span>
          </div>
          <div className="flex items-center">
            <span className="font-semibold text-gray-600 w-20">Email:</span>
            <span className="ml-2 font-semibold text-gray-900">
              {student.email || 'N/A'}
            </span>
          </div>
          <div className="col-span-2">
            <div className="flex items-center">
              <span className="font-semibold text-gray-600 w-20">Address:</span>
              <span className="ml-2 font-semibold text-gray-900 leading-relaxed">
                {student.address}
              </span>
            </div>
          </div>
          <div className="flex items-center">
            <span className="font-semibold text-gray-600 w-20">City:</span>
            <span className="ml-2 font-semibold text-gray-900">{student.city}</span>
          </div>
          <div className="flex items-center">
            <span className="font-semibold text-gray-600 w-20">State:</span>
            <span className="ml-2 font-semibold text-gray-900">{student.state}</span>
          </div>
          <div className="col-span-2 flex items-center">
            <span className="font-semibold text-gray-600 w-20">Pincode:</span>
            <span className="ml-2 font-semibold text-gray-900">{student.pincode}</span>
          </div>
        </div>
      </div>

      {/* Parent/Guardian Information */}
      <div className="relative z-10 mb-4 border border-gray-300 rounded-lg p-4 bg-gray-50">
        <h3 className="text-base font-semibold text-gray-900 mb-4 uppercase border-b border-gray-400 pb-2">
          Parent / Guardian Information
        </h3>

        {/* Father */}
        <div className="mb-4 p-4 rounded-lg border border-gray-300 bg-white">
          <h4 className="text-sm font-bold text-gray-900 mb-3 uppercase">
            Father Details
          </h4>
          <div className="flex items-start gap-4">
            <div className="flex-1 grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center">
                <span className="font-semibold text-gray-600 w-24">Name:</span>
                <span className="ml-2 font-semibold text-gray-900 capitalize">
                  {student.fatherName}
                </span>
              </div>
              <div className="flex items-center">
                <span className="font-semibold text-gray-600 w-24">Occupation:</span>
                <span className="ml-2 font-semibold text-gray-900">
                  {student.fatherOccupation || 'N/A'}
                </span>
              </div>
              <div className="flex items-center">
                <span className="font-semibold text-gray-600 w-24">Phone:</span>
                <span className="ml-2 font-semibold text-gray-900">
                  {student.fatherPhone || 'N/A'}
                </span>
              </div>
              {student.fatherAadharNumber && (
                <div className="flex items-center">
                  <span className="font-semibold text-gray-600 w-24">Aadhaar:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {student.fatherAadharNumber}
                  </span>
                </div>
              )}
            </div>
            {student.fatherPhoto && (
              <div className="flex-shrink-0">
                <img
                  src={student.fatherPhoto}
                  alt="Father"
                  className="w-24 h-24 object-cover rounded-lg shadow-md"
                />
              </div>
            )}
          </div>
        </div>

        {/* Mother */}
        <div className="mb-4 p-4 rounded-lg border border-gray-300 bg-white">
          <h4 className="text-sm font-bold text-gray-900 mb-3 uppercase">
            Mother Details
          </h4>
          <div className="flex items-start gap-4">
            <div className="flex-1 grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center">
                <span className="font-semibold text-gray-600 w-24">Name:</span>
                <span className="ml-2 font-semibold text-gray-900 capitalize">
                  {student.motherName}
                </span>
              </div>
              <div className="flex items-center">
                <span className="font-semibold text-gray-600 w-24">Occupation:</span>
                <span className="ml-2 font-semibold text-gray-900">
                  {student.motherOccupation || 'N/A'}
                </span>
              </div>
              <div className="flex items-center">
                <span className="font-semibold text-gray-600 w-24">Phone:</span>
                <span className="ml-2 font-semibold text-gray-900">
                  {student.motherPhone || 'N/A'}
                </span>
              </div>
            </div>
            {student.motherPhoto && (
              <div className="flex-shrink-0">
                <img
                  src={student.motherPhoto}
                  alt="Mother"
                  className="w-24 h-24 object-cover rounded-lg shadow-md"
                />
              </div>
            )}
          </div>
        </div>

        {/* Guardian */}
        {(student.guardianName || student.guardianPhoto) && (
          <div className="break-before-page">
            <div className="p-4 rounded-lg border border-gray-300 bg-white">
              <h4 className="text-sm font-bold text-gray-900 mb-3 uppercase">
                Guardian Details
              </h4>
              <div className="flex items-start gap-4">
                <div className="flex-1 grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center">
                    <span className="font-semibold text-gray-600 w-24">Name:</span>
                    <span className="ml-2 font-semibold text-gray-900 capitalize">
                      {student.guardianName || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-semibold text-gray-600 w-24">Relation:</span>
                    <span className="ml-2 font-semibold text-gray-900 capitalize">
                      {student.guardianRelation || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-semibold text-gray-600 w-24">Phone:</span>
                    <span className="ml-2 font-semibold text-gray-900">
                      {student.guardianPhone || 'N/A'}
                    </span>
                  </div>
                </div>
                {student.guardianPhoto && (
                  <div className="flex-shrink-0">
                    <img
                      src={student.guardianPhoto}
                      alt="Guardian"
                      className="w-24 h-24 object-cover rounded-lg shadow-md"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Declaration & Signatures */}
      <div className="relative z-10">
      {/* Declaration */}
      <div className="mb-4 p-4 border border-gray-300 rounded-lg bg-gray-50">
        <h3 className="text-base font-bold text-gray-900 mb-3 uppercase">
          Declaration
        </h3>
          <p className="text-xs text-gray-700 leading-relaxed">
            I hereby declare that the information provided above is true and correct to the best of my
            knowledge and belief. I agree to abide by the rules and regulations of the school and
            accept the decision of the school authorities as final in all matters.
          </p>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-3 gap-4 p-4 border-t border-gray-400">
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-20">Parent/Guardian Signature</p>
            <div className="border-b border-gray-600"></div>
            <p className="text-xs text-gray-600 mt-2">Date: _______________</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700 mb-20">Manager Signature</p>
            <div className="border-b border-gray-600"></div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-700 mb-20">Principal Signature</p>
            <div className="border-b border-gray-600"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdmissionFormModal;
