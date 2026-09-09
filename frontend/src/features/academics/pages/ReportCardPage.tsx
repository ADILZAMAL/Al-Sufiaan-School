import { useQuery } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import { HiOutlineArrowLeft } from 'react-icons/hi';
import { FiDownload } from 'react-icons/fi';
import { useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { marksApi, examEventApi } from '../api';
import { EventReportCard, EventReportStudent, AnnualReportCard, ExamEvent } from '../types';
import { useAppContext } from '../../../providers/AppContext';
import { getCurrentSchool, School } from '../../../api/school';
import SessionSelector from '../../sessions/components/SessionSelector';
import { academicSessionApi } from '../../sessions/api';
import { fetchClasses, ClassType } from '../../class/api/index';

// ── Shared PDF helpers ───────────────────────────────────────────────────────

const PDF = {
  Navy: [15, 52, 96] as [number, number, number],
  White: [255, 255, 255] as [number, number, number],
  Gray100: [241, 245, 249] as [number, number, number],
  Gray400: [148, 163, 184] as [number, number, number],
  Gray700: [51, 65, 85] as [number, number, number],
};

const safeFile = (s: string) => s.replace(/[^a-zA-Z0-9]/g, '_');

// Loads an image URL (Cloudinary ok via crossOrigin) → PNG data URL, or null on failure.
const toPngDataUrl = (src: string): Promise<string | null> =>
  new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 600;
      canvas.height = img.naturalHeight || 600;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(null); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      try { resolve(canvas.toDataURL('image/png')); }
      catch { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });

// CBSE-style letter grade from a percentage.
const gradeFor = (pct: number): string => {
  if (pct >= 91) return 'A1';
  if (pct >= 81) return 'A2';
  if (pct >= 71) return 'B1';
  if (pct >= 61) return 'B2';
  if (pct >= 51) return 'C1';
  if (pct >= 41) return 'C2';
  if (pct >= 33) return 'D';
  return 'E';
};

// 1 -> "1st", 2 -> "2nd", 11 -> "11th" ...
const ordinal = (n: number): string => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
};

interface StudentSummary {
  obtained: number;
  maxTotal: number;
  pct: number | null;
  rank: number | null;
  rankOf: number;
}

// Draws one A4 portrait report-card page onto the current page of `doc` (Classic layout).
function renderCardPage(doc: jsPDF, ctx: {
  student: EventReportStudent;
  photo: string | null;
  logo: string | null;
  school: School | undefined;
  examEventName: string;
  sessionName: string;
  className: string;
  sectionName: string;
  subjects: EventReportCard['subjects'];
  summary: StudentSummary | undefined;
}) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const M = 12;
  let y = M;

  // ── Header ──
  const logoSize = 22;
  if (ctx.logo) doc.addImage(ctx.logo, 'PNG', M, y, logoSize, logoSize);
  const infoX = ctx.logo ? M + logoSize + 5 : M;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...PDF.Navy);
  doc.text((ctx.school?.name ?? 'Al-Sufiaan School').toUpperCase(), infoX, y + 6);
  const address = [ctx.school?.street, ctx.school?.city, ctx.school?.district, ctx.school?.state, ctx.school?.pincode]
    .filter(Boolean).join(', ');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...PDF.Gray700);
  if (address) doc.text(address, infoX, y + 12);
  const contact: string[] = [];
  if (ctx.school?.mobile) contact.push(`Ph: ${ctx.school.mobile}`);
  if (ctx.school?.email) contact.push(`Email: ${ctx.school.email}`);
  if (ctx.school?.udiceCode) contact.push(`UDISE: ${ctx.school.udiceCode}`);
  if (contact.length) {
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(contact.join('   |   '), infoX, y + 18);
  }
  const headerBottom = y + logoSize + 3;
  doc.setDrawColor(...PDF.Navy);
  doc.setLineWidth(0.6);
  doc.line(M, headerBottom, pageW - M, headerBottom);
  doc.setLineWidth(0.2);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...PDF.Navy);
  doc.text('REPORT CARD', pageW / 2, headerBottom + 7, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...PDF.Gray700);
  doc.text(`Academic Session ${ctx.sessionName}`, pageW / 2, headerBottom + 12.5, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...PDF.Gray700);
  doc.text(ctx.examEventName.toUpperCase(), pageW / 2, headerBottom + 18, { align: 'center' });
  y = headerBottom + 25;

  // ── Identity band (photo boxed top-right) ──
  const photoW = 30;
  const photoH = 36;
  const photoX = pageW - M - photoW;
  const photoY = y;
  doc.setDrawColor(...PDF.Gray400);
  doc.setLineWidth(0.3);
  doc.rect(photoX, photoY, photoW, photoH);
  if (ctx.photo) {
    doc.addImage(ctx.photo, 'PNG', photoX + 0.6, photoY + 0.6, photoW - 1.2, photoH - 1.2);
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...PDF.Gray400);
    doc.text('No Photo', photoX + photoW / 2, photoY + photoH / 2, { align: 'center' });
  }

  const rows: [string, string][] = [
    ['Name', ctx.student.studentName],
    ["Father's Name", ctx.student.fatherName ?? '—'],
    ['Class & Section', `${ctx.className} - ${ctx.sectionName}`],
    ['Roll No.', ctx.student.rollNumber ?? '—'],
    ['Admission No.', ctx.student.admissionNumber ?? '—'],
  ];
  doc.setFontSize(9.5);
  let ry = y + 4;
  rows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF.Gray700);
    doc.text(`${label}:`, M, ry);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(String(value), M + 36, ry);
    ry += 7;
  });
  y = Math.max(ry, photoY + photoH) + 8;

  // ── Marks table ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...PDF.Navy);
  doc.text('ACADEMIC PERFORMANCE', M, y);
  y += 3;

  const body = ctx.subjects.map(subject => {
    const mark = subject.marks.find(m => m.studentId === ctx.student.studentId);
    if (!mark || mark.isAbsent) return [subject.subjectName, String(subject.totalMarks), 'Absent', '—', '—'];
    if (mark.marksObtained === null) return [subject.subjectName, String(subject.totalMarks), '—', '—', '—'];
    const p = subject.totalMarks > 0 ? (mark.marksObtained / subject.totalMarks) * 100 : 0;
    return [
      subject.subjectName,
      String(subject.totalMarks),
      String(mark.marksObtained),
      `${Math.round(p)}%`,
      gradeFor(p),
    ];
  });
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [['Subject', 'Max', 'Obtained', 'Percentage', 'Grade']],
    body,
    headStyles: { fillColor: PDF.Navy, textColor: PDF.White, fontSize: 8.5, fontStyle: 'bold', cellPadding: { top: 3, bottom: 3, left: 3, right: 3 } },
    bodyStyles: { fontSize: 9, cellPadding: { top: 2.6, bottom: 2.6, left: 3, right: 3 }, textColor: PDF.Gray700, minCellHeight: 9, valign: 'middle' },
    alternateRowStyles: { fillColor: PDF.Gray100 },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 22, halign: 'center' },
      2: { cellWidth: 26, halign: 'center' },
      3: { cellWidth: 28, halign: 'center' },
      4: { cellWidth: 20, halign: 'center' },
    },
    tableLineColor: [226, 232, 240],
    tableLineWidth: 0.2,
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // ── Summary bar ──
  const s = ctx.summary;
  const items: [string, string][] = [
    ['TOTAL', s ? `${s.obtained} / ${s.maxTotal}` : '—'],
    ['PERCENTAGE', s && s.pct !== null ? `${s.pct.toFixed(1)}%` : '—'],
    ['GRADE', s && s.pct !== null ? gradeFor(s.pct) : '—'],
    ['POSITION', s && s.rank !== null ? ordinal(s.rank) : '—'],
  ];
  const barH = 16;
  doc.setFillColor(...PDF.Navy);
  doc.roundedRect(M, y, pageW - M * 2, barH, 2, 2, 'F');
  const seg = (pageW - M * 2) / 4;
  items.forEach(([label, value], i) => {
    const cx = M + seg * i + seg / 2;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(160, 174, 192);
    doc.text(label, cx, y + 6, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...PDF.White);
    doc.text(value, cx, y + 12.5, { align: 'center' });
  });
  y += barH + 10;

  // ── Grading scale ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...PDF.Navy);
  doc.text('GRADING SCALE', M, y);
  y += 3;
  const bands: [string, string][] = [
    ['A1', '91–100'], ['A2', '81–90'], ['B1', '71–80'], ['B2', '61–70'],
    ['C1', '51–60'], ['C2', '41–50'], ['D', '33–40'], ['E', '0–32'],
  ];
  const gsH = 12;
  const gsW = (pageW - M * 2) / bands.length;
  doc.setFillColor(...PDF.Gray100);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.rect(M, y, pageW - M * 2, gsH, 'FD');
  bands.forEach(([g, r], i) => {
    const cx = M + gsW * i + gsW / 2;
    if (i > 0) doc.line(M + gsW * i, y, M + gsW * i, y + gsH);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...PDF.Navy);
    doc.text(g, cx, y + 5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...PDF.Gray700);
    doc.text(r, cx, y + 9.5, { align: 'center' });
  });
  y += gsH + 18;

  // ── Signatures ──
  const sigW = 55;
  doc.setDrawColor(...PDF.Gray400);
  doc.setLineWidth(0.3);
  doc.line(M, y, M + sigW, y);
  doc.line(pageW - M - sigW, y, pageW - M, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...PDF.Gray700);
  doc.text('Class Teacher', M, y + 5);
  doc.text('Principal', pageW - M, y + 5, { align: 'right' });

  // ── Footer ──
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(M, pageH - 16, pageW - M, pageH - 16);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...PDF.Navy);
  doc.text((ctx.school?.name ?? 'Al-Sufiaan School').toUpperCase(), pageW / 2, pageH - 11, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...PDF.Gray400);
  doc.text(
    new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    pageW - M, pageH - 11, { align: 'right' },
  );
}

// ── Mode A: Event Report Card ─────────────────────────────────────────────────

function EventReportCardView({ data, school }: { data: EventReportCard; school: School | undefined }) {
  const { showToast } = useAppContext();
  const [pdfLoading, setPdfLoading] = useState(false);
  const [cardLoadingId, setCardLoadingId] = useState<number | null>(null);
  const { examEvent, students, subjects } = data;
  const schoolName = school?.name ?? 'Al-Sufiaan School';
  const className = data.class?.name ?? '—';
  const sectionName = data.section?.name ?? '—';

  const getMarkForStudent = (subject: EventReportCard['subjects'][number], studentId: number) => {
    return subject.marks.find(m => m.studentId === studentId);
  };

  // Per-student total / % / rank (rank by total marks over attempted subjects, ties shared)
  const summaries = useMemo(() => {
    const map = new Map<number, StudentSummary>();
    const rows = students.map(student => {
      let obtained = 0;
      let maxTotal = 0;
      let counted = 0;
      subjects.forEach(subject => {
        const mark = subject.marks.find(m => m.studentId === student.studentId);
        if (!mark || mark.isAbsent || mark.marksObtained === null) return;
        obtained += mark.marksObtained;
        maxTotal += subject.totalMarks;
        counted += 1;
      });
      return { studentId: student.studentId, obtained, maxTotal, counted };
    });
    const ranked = rows.filter(r => r.counted > 0).sort((a, b) => b.obtained - a.obtained);
    const rankById = new Map<number, number>();
    ranked.forEach((r, i) => {
      const rank = i > 0 && r.obtained === ranked[i - 1].obtained
        ? rankById.get(ranked[i - 1].studentId)!
        : i + 1;
      rankById.set(r.studentId, rank);
    });
    rows.forEach(r => {
      map.set(r.studentId, {
        obtained: r.obtained,
        maxTotal: r.maxTotal,
        pct: r.maxTotal > 0 ? (r.obtained / r.maxTotal) * 100 : null,
        rank: rankById.get(r.studentId) ?? null,
        rankOf: ranked.length,
      });
    });
    return map;
  }, [students, subjects]);

  const buildReportCards = async (targets: EventReportStudent[]) => {
    if (targets.length === 0) return;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const logo = school?.logoUrl ? await toPngDataUrl(school.logoUrl) : null;
    for (let i = 0; i < targets.length; i++) {
      const student = targets[i];
      if (i > 0) doc.addPage();
      const photo = student.studentPhoto ? await toPngDataUrl(student.studentPhoto) : null;
      renderCardPage(doc, {
        student, photo, logo, school,
        examEventName: examEvent.name,
        sessionName: data.session?.name ?? '—',
        className, sectionName, subjects,
        summary: summaries.get(student.studentId),
      });
    }
    const date = new Date().toISOString().slice(0, 10);
    doc.save(targets.length === 1
      ? `ReportCard_${safeFile(targets[0].studentName)}_${safeFile(examEvent.name)}_${date}.pdf`
      : `ReportCards_${safeFile(className)}-${safeFile(sectionName)}_${safeFile(examEvent.name)}_${date}.pdf`);
  };

  const handleAllCards = async () => {
    setPdfLoading(true);
    try { await buildReportCards(students); }
    catch (e) { showToast({ message: (e as Error).message, type: 'ERROR' }); }
    finally { setPdfLoading(false); }
  };

  const handleOneCard = async (student: EventReportStudent) => {
    setCardLoadingId(student.studentId);
    try { await buildReportCards([student]); }
    catch (e) { showToast({ message: (e as Error).message, type: 'ERROR' }); }
    finally { setCardLoadingId(null); }
  };

  const downloadPDF = async () => {
    setPdfLoading(true);
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const M = 10;
      const Navy: [number, number, number] = [15, 52, 96];
      const White: [number, number, number] = [255, 255, 255];
      const Gray100: [number, number, number] = [241, 245, 249];
      const Gray400: [number, number, number] = [148, 163, 184];
      const Gray700: [number, number, number] = [51, 65, 85];

      // Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(...Navy);
      doc.text(schoolName.toUpperCase(), pageW / 2, M + 6, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...Gray700);
      doc.text(`${examEvent.name} — Report Card`, pageW / 2, M + 13, { align: 'center' });
      doc.setDrawColor(...Navy);
      doc.setLineWidth(0.5);
      doc.line(M, M + 17, pageW - M, M + 17);

      // Build table: rows = students, cols = subjects
      const head = [['Roll No', 'Adm. No', 'Student', ...subjects.map(s => `${s.subjectName}\n(${s.totalMarks})`), 'Total', '%']];
      const body = students.map(student => {
        let obtained = 0;
        let total = 0;
        const subjectCells = subjects.map(subject => {
          const mark = getMarkForStudent(subject, student.studentId);
          if (!mark || mark.isAbsent) return 'AB';
          if (mark.marksObtained === null) return '—';
          obtained += mark.marksObtained;
          total += subject.totalMarks;
          return String(mark.marksObtained);
        });
        const pct = total > 0 ? `${((obtained / total) * 100).toFixed(1)}%` : '—';
        return [student.rollNumber ?? '—', student.admissionNumber ?? '—', student.studentName, ...subjectCells, String(obtained), pct];
      });

      autoTable(doc, {
        startY: M + 22,
        margin: { left: M, right: M },
        head,
        body,
        headStyles: { fillColor: Navy, textColor: White, fontSize: 7, fontStyle: 'bold', cellPadding: 2 },
        bodyStyles: { fontSize: 7.5, cellPadding: 2, textColor: Gray700 },
        alternateRowStyles: { fillColor: Gray100 },
        columnStyles: { 0: { cellWidth: 16 }, 1: { cellWidth: 22 }, 2: { cellWidth: 34 } },
        tableLineColor: [226, 232, 240],
        tableLineWidth: 0.2,
      });

      const finalY = (doc as any).lastAutoTable.finalY;
      doc.setFontSize(7);
      doc.setTextColor(...Gray400);
      doc.text('Generated by Al-Sufiaan School Management System', M, finalY + 8);

      const safe = (s: string) => s.replace(/[^a-zA-Z0-9]/g, '_');
      doc.save(`ReportCard_${safe(examEvent.name)}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{examEvent.name}</h2>
          <p className="text-sm text-gray-500">{students.length} students · {subjects.length} subjects</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadPDF}
            disabled={pdfLoading || cardLoadingId !== null}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
          >
            <FiDownload size={13} />
            Download List
          </button>
          <button
            onClick={handleAllCards}
            disabled={pdfLoading || cardLoadingId !== null}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {pdfLoading
              ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <FiDownload size={13} />}
            {pdfLoading ? 'Generating…' : 'Download All Report Cards'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Roll No</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Adm. No</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Student</th>
              {subjects.map(s => (
                <th key={s.subjectId} className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">
                  {s.subjectName}
                  <span className="block text-gray-400 font-normal normal-case">/{s.totalMarks}</span>
                </th>
              ))}
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Total</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">%</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Card</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {students.map(student => {
              let obtained = 0;
              let total = 0;
              const cells = subjects.map(subject => {
                const mark = getMarkForStudent(subject, student.studentId);
                if (!mark || mark.isAbsent) {
                  return <td key={subject.subjectId} className="px-4 py-2.5 text-center text-xs text-amber-600 font-medium">AB</td>;
                }
                if (mark.marksObtained === null) {
                  return <td key={subject.subjectId} className="px-4 py-2.5 text-center text-xs text-gray-400">—</td>;
                }
                const passed = mark.marksObtained >= subject.passingMarks;
                obtained += mark.marksObtained;
                total += subject.totalMarks;
                return (
                  <td key={subject.subjectId} className={`px-4 py-2.5 text-center text-xs font-medium ${passed ? 'text-gray-800' : 'text-red-600'}`}>
                    {mark.marksObtained}
                  </td>
                );
              });
              const pct = total > 0 ? ((obtained / total) * 100).toFixed(1) : null;
              return (
                <tr key={student.studentId} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-sm text-gray-600 whitespace-nowrap">{student.rollNumber ?? '—'}</td>
                  <td className="px-4 py-2.5 text-sm text-gray-600 whitespace-nowrap">{student.admissionNumber ?? '—'}</td>
                  <td className="px-4 py-2.5 text-sm font-semibold text-gray-800 whitespace-nowrap">{student.studentName}</td>
                  {cells}
                  <td className="px-4 py-2.5 text-center text-sm font-bold text-gray-900">{obtained}</td>
                  <td className="px-4 py-2.5 text-center text-sm font-bold text-blue-600">{pct ? `${pct}%` : '—'}</td>
                  <td className="px-4 py-2.5 text-center">
                    <button
                      onClick={() => handleOneCard(student)}
                      disabled={pdfLoading || cardLoadingId !== null}
                      title="Download report card"
                      className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-40 disabled:hover:bg-transparent transition"
                    >
                      {cardLoadingId === student.studentId
                        ? <span className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        : <FiDownload size={14} />}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Mode B: Annual Report Card ────────────────────────────────────────────────

function AnnualReportCardView({ data, schoolName }: { data: AnnualReportCard; schoolName: string }) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const { student, enrollment, examEvents, subjects } = data;
  const studentName = `${student.firstName} ${student.lastName}`;

  const downloadPDF = async () => {
    setPdfLoading(true);
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const M = 10;
      const Navy: [number, number, number] = [15, 52, 96];
      const White: [number, number, number] = [255, 255, 255];
      const Gray100: [number, number, number] = [241, 245, 249];
      const Gray400: [number, number, number] = [148, 163, 184];
      const Gray700: [number, number, number] = [51, 65, 85];

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(...Navy);
      doc.text(schoolName.toUpperCase(), pageW / 2, M + 6, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...Gray700);
      doc.text(`Annual Report Card — ${studentName}  |  ${enrollment.class.name} ${enrollment.section.name}`, pageW / 2, M + 13, { align: 'center' });
      doc.setDrawColor(...Navy);
      doc.setLineWidth(0.5);
      doc.line(M, M + 17, pageW - M, M + 17);

      const head = [['Subject', 'Class Tests (Avg %)', ...examEvents.map(e => e.name)]];
      const body = subjects.map(sub => {
        const ctAvg = sub.classTestAvg.percentage !== null
          ? `${sub.classTestAvg.percentage.toFixed(1)}%`
          : '—';
        const eventCells = examEvents.map(ev => {
          const res = sub.examEvents.find(e => e.eventId === ev.id);
          if (!res || res.totalMarks === null) return '—';
          if (res.isAbsent) return 'AB';
          if (res.marksObtained === null) return '—';
          return `${res.marksObtained}/${res.totalMarks}`;
        });
        return [sub.subjectName, ctAvg, ...eventCells];
      });

      autoTable(doc, {
        startY: M + 22,
        margin: { left: M, right: M },
        head,
        body,
        headStyles: { fillColor: Navy, textColor: White, fontSize: 7.5, fontStyle: 'bold', cellPadding: 2.5 },
        bodyStyles: { fontSize: 8, cellPadding: 2.5, textColor: Gray700 },
        alternateRowStyles: { fillColor: Gray100 },
        columnStyles: { 0: { cellWidth: 45 }, 1: { cellWidth: 30, halign: 'center' } },
        tableLineColor: [226, 232, 240],
        tableLineWidth: 0.2,
      });

      const finalY = (doc as any).lastAutoTable.finalY;
      doc.setFontSize(7);
      doc.setTextColor(...Gray400);
      doc.text('Generated by Al-Sufiaan School Management System', M, finalY + 8);

      const safe = (s: string) => s.replace(/[^a-zA-Z0-9]/g, '_');
      doc.save(`Annual_${safe(studentName)}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Student info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{studentName}</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {enrollment.class.name} · {enrollment.section.name}
            {enrollment.rollNumber ? ` · Roll ${enrollment.rollNumber}` : ''}
          </p>
        </div>
        <button
          onClick={downloadPDF}
          disabled={pdfLoading}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {pdfLoading
            ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <FiDownload size={13} />}
          {pdfLoading ? 'Generating…' : 'Download PDF'}
        </button>
      </div>

      {/* Annual table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Subject</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Class Tests<span className="block font-normal normal-case text-gray-400">Avg %</span></th>
              {examEvents.map(ev => (
                <th key={ev.id} className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{ev.name}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {subjects.map(sub => (
              <tr key={sub.subjectId} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-semibold text-gray-800">{sub.subjectName}</td>
                <td className="px-4 py-3 text-center">
                  {sub.classTestAvg.percentage !== null ? (
                    <span className={`text-sm font-bold ${sub.classTestAvg.percentage >= 50 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {sub.classTestAvg.percentage.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>
                {examEvents.map(ev => {
                  const res = sub.examEvents.find(e => e.eventId === ev.id);
                  if (!res || res.totalMarks === null) {
                    return <td key={ev.id} className="px-4 py-3 text-center text-xs text-gray-400">—</td>;
                  }
                  if (res.isAbsent) {
                    return <td key={ev.id} className="px-4 py-3 text-center text-xs text-amber-600 font-medium">Absent</td>;
                  }
                  if (res.marksObtained === null) {
                    return <td key={ev.id} className="px-4 py-3 text-center text-xs text-gray-400">—</td>;
                  }
                  const passed = res.passingMarks !== null && res.marksObtained >= res.passingMarks;
                  return (
                    <td key={ev.id} className="px-4 py-3 text-center">
                      <span className={`text-sm font-bold ${passed ? 'text-gray-800' : 'text-red-600'}`}>
                        {res.marksObtained}
                      </span>
                      <span className="text-xs text-gray-400">/{res.totalMarks}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Picker: choose an exam event to generate an Event report card ─────────────

const selectClass = 'border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:text-gray-400';

function ReportCardPicker({
  onSubmit,
}: {
  onSubmit: (ids: { examEventId: number; classId: number; sectionId: number; sessionId: number }) => void;
}) {
  const { data: activeSession } = useQuery('activeSession', academicSessionApi.getActiveSession, {
    staleTime: 5 * 60 * 1000,
  });

  const [manualSessionId, setManualSessionId] = useState<number | null>(null);
  const sessionId = manualSessionId ?? activeSession?.id ?? null;

  const [classId, setClassId] = useState<number | null>(null);
  const [sectionId, setSectionId] = useState<number | null>(null);
  const [examEventId, setExamEventId] = useState<number | null>(null);

  const { data: classes = [] } = useQuery<ClassType[]>(
    ['classes', sessionId],
    () => fetchClasses(sessionId as number),
    { enabled: !!sessionId },
  );

  const { data: examEvents = [] } = useQuery<ExamEvent[]>(
    ['exam-events', sessionId],
    () => examEventApi.list(sessionId as number),
    { enabled: !!sessionId },
  );

  const selectedClass = classes.find(c => c.id === classId) ?? null;
  const sections = selectedClass?.sections ?? [];

  const canSubmit = !!examEventId && !!classId && !!sectionId && !!sessionId;

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Report Card</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Select an exam event to generate a class-wide report card
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div className="space-y-1.5">
            <SessionSelector
              value={sessionId}
              onChange={id => {
                setManualSessionId(id);
                setClassId(null);
                setSectionId(null);
                setExamEventId(null);
              }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Class</label>
            <select
              value={classId ?? ''}
              disabled={!sessionId}
              onChange={e => {
                setClassId(e.target.value ? Number(e.target.value) : null);
                setSectionId(null);
              }}
              className={`${selectClass} w-full`}
            >
              <option value="">Select class</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Section</label>
            <select
              value={sectionId ?? ''}
              disabled={!classId}
              onChange={e => setSectionId(e.target.value ? Number(e.target.value) : null)}
              className={`${selectClass} w-full`}
            >
              <option value="">Select section</option>
              {sections.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Exam Event</label>
            <select
              value={examEventId ?? ''}
              disabled={!sessionId}
              onChange={e => setExamEventId(e.target.value ? Number(e.target.value) : null)}
              className={`${selectClass} w-full`}
            >
              <option value="">Select exam event</option>
              {examEvents.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => canSubmit && onSubmit({ examEventId: examEventId!, classId: classId!, sectionId: sectionId!, sessionId: sessionId! })}
            disabled={!canSubmit}
            className="w-full px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            View Report Card
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ReportCardPage() {
  const { showToast } = useAppContext();
  const [searchParams, setSearchParams] = useSearchParams();

  const examEventId = searchParams.get('examEventId') ? Number(searchParams.get('examEventId')) : null;
  const classId     = searchParams.get('classId')     ? Number(searchParams.get('classId'))     : null;
  const sectionId   = searchParams.get('sectionId')   ? Number(searchParams.get('sectionId'))   : null;
  const sessionId   = searchParams.get('sessionId')   ? Number(searchParams.get('sessionId'))   : null;
  const studentId   = searchParams.get('studentId')   ? Number(searchParams.get('studentId'))   : null;

  const isEventMode  = !!examEventId && !!classId && !!sectionId && !!sessionId;
  const isAnnualMode = !!studentId && !!sessionId;

  const { data: school } = useQuery('currentSchool', getCurrentSchool, { staleTime: 10 * 60 * 1000 });
  const schoolName = school?.name ?? 'Al-Sufiaan School';

  const { data: eventReport, isLoading: eventLoading } = useQuery<EventReportCard>(
    ['report-card-event', examEventId, classId, sectionId, sessionId],
    () => marksApi.getEventReportCard(examEventId!, classId!, sectionId!, sessionId!),
    {
      enabled: isEventMode,
      onError: (e: unknown) => showToast({ message: (e as Error).message, type: 'ERROR' }),
    }
  );

  const { data: annualReport, isLoading: annualLoading } = useQuery<AnnualReportCard>(
    ['report-card-annual', studentId, sessionId],
    () => marksApi.getAnnualReportCard(studentId!, sessionId!),
    {
      enabled: isAnnualMode,
      onError: (e: unknown) => showToast({ message: (e as Error).message, type: 'ERROR' }),
    }
  );

  const isLoading = eventLoading || annualLoading;

  if (!isEventMode && !isAnnualMode) {
    return (
      <ReportCardPicker
        onSubmit={({ examEventId, classId, sectionId, sessionId }) =>
          setSearchParams({
            examEventId: String(examEventId),
            classId: String(classId),
            sectionId: String(sectionId),
            sessionId: String(sessionId),
          })
        }
      />
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSearchParams({})}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white border border-transparent hover:border-gray-200 rounded-lg transition"
          >
            <HiOutlineArrowLeft className="text-lg" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEventMode ? 'Event Report Card' : 'Annual Report Card'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {isEventMode ? 'Class-wide marks summary for this exam event' : 'Full-year academic summary for this student'}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : isEventMode && eventReport ? (
          <EventReportCardView data={eventReport} school={school} />
        ) : isAnnualMode && annualReport ? (
          <AnnualReportCardView data={annualReport} schoolName={schoolName} />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 py-20 text-center">
            <p className="text-gray-500">No data available.</p>
          </div>
        )}
      </div>
    </div>
  );
}
