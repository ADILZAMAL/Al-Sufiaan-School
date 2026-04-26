import { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { FaListAlt } from 'react-icons/fa';
import { FiDownload } from 'react-icons/fi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { subjectApi, examApi, marksApi } from '../api';
import { StudentExamMark } from '../types';
import { academicSessionApi } from '../../sessions/api';
import { AcademicSession } from '../../sessions/types';
import { fetchClasses, ClassType } from '../../class/api';
import SessionSelector from '../../sessions/components/SessionSelector';
import { useAppContext } from '../../../providers/AppContext';
import { getCurrentSchool } from '../../../api/school';

export default function MarksViewerPage() {
  const { showToast } = useAppContext();

  const [manualSessionId, setManualSessionId] = useState<number | null>(null);
  const [activeClass, setActiveClass] = useState<ClassType | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<number | null>(null);
  const [subjectId, setSubjectId] = useState<number | ''>('');
  const [examId, setExamId] = useState<number | ''>('');

  const { data: activeSession } = useQuery<AcademicSession | null>(
    'activeSession',
    academicSessionApi.getActiveSession,
    { staleTime: 5 * 60 * 1000 }
  );

  const selectedSessionId = manualSessionId ?? activeSession?.id ?? null;

  const { data: classes = [], isLoading: classesLoading } = useQuery<ClassType[]>(
    ['classes', selectedSessionId],
    () => fetchClasses(selectedSessionId as number),
    { enabled: selectedSessionId !== null }
  );

  const sections = activeClass?.sections || [];

  const { data: subjects = [] } = useQuery(
    ['subjects', selectedSessionId, activeClass?.id],
    () => subjectApi.list(selectedSessionId as number, activeClass!.id),
    { enabled: selectedSessionId !== null && activeClass !== null }
  );

  const { data: exams = [] } = useQuery(
    ['exams', 'subject', subjectId],
    () => examApi.list(subjectId as number),
    { enabled: !!subjectId }
  );

  const { data: marks = [], isLoading: marksLoading } = useQuery<StudentExamMark[]>(
    ['marks', examId, activeSectionId, selectedSessionId],
    () => marksApi.getByExam(examId as number, activeSectionId ?? undefined, selectedSessionId ?? undefined),
    {
      enabled: !!examId,
      onError: (e: unknown) => showToast({ message: (e as Error).message, type: 'ERROR' }),
    }
  );

  const { data: school } = useQuery('currentSchool', getCurrentSchool, { staleTime: 10 * 60 * 1000 });

  // Auto-select first class
  useEffect(() => {
    if (classes.length > 0) {
      setActiveClass(prev => {
        if (prev) {
          const updated = classes.find(c => c.id === prev.id);
          return updated ?? classes[0];
        }
        return classes[0];
      });
    } else {
      setActiveClass(null);
    }
    setActiveSectionId(null);
    setSubjectId('');
    setExamId('');
  }, [classes]);

  // Auto-select first section when class changes
  useEffect(() => {
    if (sections.length > 0) {
      setActiveSectionId(prev => {
        if (prev && sections.find(s => s.id === prev)) return prev;
        return sections[0].id;
      });
    } else {
      setActiveSectionId(null);
    }
    setSubjectId('');
    setExamId('');
  }, [activeClass]);

  const handleSessionChange = (id: number) => {
    setManualSessionId(id);
    setActiveClass(null);
    setActiveSectionId(null);
    setSubjectId('');
    setExamId('');
  };

  const selectedExam = exams.find(e => e.id === examId);
  const presentMarks = marks.filter(m => !m.isAbsent && m.marksObtained !== null).map(m => Number(m.marksObtained));
  const avg = presentMarks.length ? (presentMarks.reduce((a, b) => a + b, 0) / presentMarks.length).toFixed(1) : '—';
  const highest = presentMarks.length ? Math.max(...presentMarks) : '—';
  const lowest = presentMarks.length ? Math.min(...presentMarks) : '—';
  const passCount = presentMarks.filter(m => selectedExam && m >= selectedExam.passingMarks).length;

  const pct = (m: number | null) => {
    if (m === null || !selectedExam) return '—';
    return `${((m / selectedExam.totalMarks) * 100).toFixed(1)}%`;
  };

  const [pdfLoading, setPdfLoading] = useState(false);

  // Renders text using the browser's own font engine (supports Hindi/Devanagari, Arabic, etc.)
  // Returns a PNG data URL for embedding in jsPDF.
  const textToImage = (text: string, fontPx: number, color: string, bold: boolean, maxWidthMm: number): string => {
    const PX_PER_MM = 3.78;  // 96dpi
    const scale    = 3;       // supersample for sharpness
    const w = Math.ceil(maxWidthMm * PX_PER_MM * scale);
    const h = Math.ceil(fontPx * 2.5 * scale); // extra height for Devanagari matras above baseline
    const canvas = document.createElement('canvas');
    canvas.width  = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(scale, scale);
    // Use plain 'sans-serif' so the OS picks its default multilingual font (supports Devanagari)
    ctx.font = `${bold ? '700' : '400'} ${fontPx}px sans-serif`;
    ctx.fillStyle = color;
    ctx.textBaseline = 'middle';
    // Do NOT pass maxWidth to fillText — it distorts glyphs; truncation handles overflow
    ctx.fillText(text, 0, (h / scale) / 2);
    return canvas.toDataURL('image/png');
  };

  // Loads any image URL (or data URL) and converts it to a PNG data URL via canvas.
  // crossOrigin='anonymous' allows Cloudinary-hosted images to be drawn without tainting the canvas.
  const toPngDataUrl = (src: string): Promise<string | null> =>
    new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const size = 600; // fixed high-res to keep logo sharp in PDF
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(null); return; }
        ctx.drawImage(img, 0, 0, size, size);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(null);
      img.src = src;
    });


  const downloadPDF = async () => {
    if (!selectedExam || marks.length === 0) return;
    setPdfLoading(true);
    try {
      // ── Load logo directly from Cloudinary URL (crossOrigin='anonymous' handles CORS) ──
      const logoBase64 = school?.logoUrl ? await toPngDataUrl(school.logoUrl) : null;

      // ── Sort: ranked (desc marks) then absent ──
      const presentSorted = marks
        .filter(m => !m.isAbsent && m.marksObtained !== null)
        .sort((a, b) => Number(b.marksObtained) - Number(a.marksObtained));
      const absentRows = marks.filter(m => m.isAbsent || m.marksObtained === null);
      const sortedMarks = [...presentSorted, ...absentRows];

      // ── Labels ──
      const sectionName  = sections.find(s => s.id === activeSectionId)?.name ?? '';
      const subjectName  = (subjects as any[]).find(s => s.id === subjectId)?.name ?? '';
      const examEventName = selectedExam?.examEvent?.name ?? '';
      const sessionName  = activeSession?.name ?? '';
      const schoolName   = school?.name ?? 'Al-Sufiaan School';

      // ── Doc setup ──
      const doc   = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();   // 210

      const M     = 12; // margin
      const Navy  : [number,number,number] = [15, 52, 96];
      const Blue  : [number,number,number] = [37, 99, 235];
      const White : [number,number,number] = [255, 255, 255];
      const Gray50: [number,number,number] = [248, 250, 252];
      const Gray100:[number,number,number] = [241, 245, 249];
      const Gray400:[number,number,number] = [148, 163, 184];
      const Gray700:[number,number,number] = [51, 65, 85];

      // ━━━ HEADER (fee receipt style) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      let y = M;

      // Logo — left, large
      const logoSize = 22;
      if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', M, y, logoSize, logoSize);
      }

      // School info — to the right of logo
      const infoX = logoBase64 ? M + logoSize + 5 : M;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(...Navy);
      doc.text(schoolName.toUpperCase(), infoX, y + 6);

      const address = [school?.street, school?.city, school?.district, school?.state, school?.pincode]
        .filter(Boolean).join(', ');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...Gray700);
      if (address) doc.text(address, infoX, y + 12);

      const contactParts: string[] = [];
      if (school?.mobile)    contactParts.push(`Ph: ${school.mobile}`);
      if (school?.email)     contactParts.push(`Email: ${school.email}`);
      contactParts.push('www.alsufiaanschool.in');
      if (school?.udiceCode) contactParts.push(`UDISE: ${school.udiceCode}`);
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(contactParts.join('   |   '), infoX, y + 18);

      // Thick bottom border — like fee receipt
      const headerBottom = y + logoSize + 3;
      doc.setDrawColor(...Navy);
      doc.setLineWidth(0.6);
      doc.line(M, headerBottom, pageW - M, headerBottom);
      doc.setLineWidth(0.2);

      // "MARKS REPORT" subtitle centred below border
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...Navy);
      doc.text('MARKS REPORT', pageW / 2, headerBottom + 6, { align: 'center' });

      y = headerBottom + 11;

      // ━━━ INFO PANELS (2-column grid) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      const panelGap  = 4;
      const panelW    = (pageW - M * 2 - panelGap) / 2;
      const panelH    = 32;
      const panelR    = 2.5;
      const textW     = panelW - 10; // max text width inside panel

      const truncate = (s: string, max = 38) => s.length > max ? s.slice(0, max - 1) + '…' : s;

      const drawPanel = (px: number, py: number, rows: { label: string; value: string }[]) => {
        doc.setFillColor(...Gray50);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(px, py, panelW, panelH, panelR, panelR, 'FD');
        // left accent bar
        doc.setFillColor(...Blue);
        doc.roundedRect(px, py, 2.5, panelH, panelR, panelR, 'F');
        rows.forEach((row, ri) => {
          const ry = py + 6 + ri * 6.5;
          // Render "Label: Value" as a single canvas image so Hindi/Devanagari values show correctly
          const line  = `${row.label.charAt(0) + row.label.slice(1).toLowerCase()}: ${truncate(row.value)}`;
          const imgW  = textW;
          const imgH  = 6;
          const imgData = textToImage(line, 9, '#1e293b', false, imgW);
          doc.addImage(imgData, 'PNG', px + 6, ry - 2, imgW, imgH);
        });
      };

      drawPanel(M, y, [
        { label: 'SESSION',  value: sessionName },
        { label: 'CLASS',    value: activeClass?.name ?? '' },
        { label: 'SECTION',  value: sectionName },
        { label: 'SUBJECT',  value: subjectName },
      ]);

      drawPanel(M + panelW + panelGap, y, [
        ...(examEventName ? [{ label: 'Exam Event', value: examEventName }] : []),
        { label: 'Exam',          value: selectedExam.name },
        { label: 'Total Marks',   value: String(selectedExam.totalMarks) },
        { label: 'Passing Marks', value: String(selectedExam.passingMarks) },
      ]);

      y += panelH + 6;

      // ━━━ STAT CARDS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      const statDefs = [
        { label: 'CLASS AVG',   value: `${avg}`,         sub: `/ ${selectedExam.totalMarks}`, accent: [37,99,235]  as [number,number,number], bg: [239,246,255] as [number,number,number] },
        { label: 'HIGHEST',     value: String(highest),  sub: 'marks',                        accent: [22,163,74]  as [number,number,number], bg: [240,253,244] as [number,number,number] },
        { label: 'LOWEST',      value: String(lowest),   sub: 'marks',                        accent: [220,38,38]  as [number,number,number], bg: [254,242,242] as [number,number,number] },
        { label: 'PASSED',      value: `${passCount}`,   sub: `/ ${marks.length}`,            accent: [124,58,237] as [number,number,number], bg: [245,243,255] as [number,number,number] },
      ];
      const cardGap = 3;
      const cardW   = (pageW - M * 2 - cardGap * 3) / 4;
      const cardH   = 18;

      statDefs.forEach((s, i) => {
        const cx = M + i * (cardW + cardGap);
        doc.setFillColor(...s.bg);
        doc.setDrawColor(s.accent[0], s.accent[1], s.accent[2]);
        doc.roundedRect(cx, y, cardW, cardH, 2, 2, 'FD');
        // top accent bar
        doc.setFillColor(...s.accent);
        doc.roundedRect(cx, y, cardW, 2.5, 2, 2, 'F');
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...s.accent);
        doc.text(s.label, cx + cardW / 2, y + 7, { align: 'center' });
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(s.accent[0], s.accent[1], s.accent[2]);
        doc.text(s.value, cx + cardW / 2, y + 13.5, { align: 'center' });
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...Gray400);
        doc.text(s.sub, cx + cardW / 2, y + 17, { align: 'center' });
      });

      y += cardH + 6;

      // ━━━ TABLE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      autoTable(doc, {
        startY: y,
        margin: { left: M, right: M },
        head: [[
          { content: 'Roll',        styles: { halign: 'center' } },
          { content: 'Adm No',      styles: { halign: 'center' } },
          { content: 'Student Name' },
          { content: 'Father Name' },
          { content: 'Marks',       styles: { halign: 'center' } },
          { content: '%',           styles: { halign: 'center' } },
          { content: 'Result',      styles: { halign: 'center' } },
        ]],
        body: sortedMarks.map((mark) => {
          const isAbsent   = mark.isAbsent || mark.marksObtained === null;
          const isPassed   = !isAbsent && selectedExam && Number(mark.marksObtained) >= selectedExam.passingMarks;
          const rollNum    = mark.student?.enrollments?.[0]?.rollNumber ?? '—';
          const admNo      = mark.student?.admissionNumber ?? '—';
          const studentName = mark.student ? `${mark.student.firstName} ${mark.student.lastName}` : `Student #${mark.studentId}`;
          const fatherName  = mark.student?.fatherName ?? '—';
          const marksStr   = isAbsent ? '—' : `${mark.marksObtained} / ${selectedExam?.totalMarks}`;
          const pctStr     = isAbsent ? '—' : pct(mark.marksObtained);
          const result     = isAbsent ? 'Absent' : isPassed ? 'Pass' : 'Fail';
          return [rollNum, admNo, studentName, fatherName, marksStr, pctStr, result];
        }),
        columnStyles: {
          0: { cellWidth: 13, halign: 'center', valign: 'middle' },
          1: { cellWidth: 27, halign: 'center', valign: 'middle' },
          2: { cellWidth: 43, valign: 'middle' },
          3: { cellWidth: 38, valign: 'middle' },
          4: { cellWidth: 20, halign: 'center', valign: 'middle' },
          5: { cellWidth: 19, halign: 'center', valign: 'middle' },
          6: { cellWidth: 23, halign: 'center', valign: 'middle' },
        },
        headStyles: {
          fillColor: Navy,
          textColor: White,
          fontSize: 7.5,
          fontStyle: 'bold',
          cellPadding: { top: 3.5, bottom: 3.5, left: 3, right: 3 },
        },
        bodyStyles: {
          fontSize: 8,
          cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
          minCellHeight: 10,
          valign: 'middle',
          textColor: Gray700,
        },
        alternateRowStyles: { fillColor: Gray100 },
        tableLineColor: [226, 232, 240],
        tableLineWidth: 0.2,
        didDrawCell: (data) => {
          if (data.section !== 'body' || data.column.index !== 6) return;
          const mark = sortedMarks[data.row.index];
          if (!mark) return;
          const isAbsent = mark.isAbsent || mark.marksObtained === null;
          const isPassed = !isAbsent && selectedExam && Number(mark.marksObtained) >= selectedExam.passingMarks;

          let bgColor: [number,number,number];
          let fgColor: [number,number,number];
          let label: string;
          if (isAbsent)       { bgColor = [241,245,249]; fgColor = [100,116,139]; label = 'Absent'; }
          else if (isPassed)  { bgColor = [220,252,231]; fgColor = [21,128,61];   label = 'Pass';   }
          else                { bgColor = [254,226,226]; fgColor = [185,28,28];   label = 'Fail';   }

          const bw = 16, bh = 5.5;
          const bx = data.cell.x + (data.cell.width - bw) / 2;
          const by = data.cell.y + (data.cell.height - bh) / 2;
          doc.setFillColor(...bgColor);
          doc.setDrawColor(...fgColor);
          doc.roundedRect(bx, by, bw, bh, 1.5, 1.5, 'FD');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7);
          doc.setTextColor(...fgColor);
          doc.text(label, bx + bw / 2, by + bh / 2 + 1, { align: 'center' });
          doc.setTextColor(...Gray700);
          doc.setFont('helvetica', 'normal');
        },
        willDrawCell: (data) => {
          if (data.section === 'body' && data.column.index === 6) data.cell.text = [];
        },
      });

      // ━━━ FOOTER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      const finalY = (doc as any).lastAutoTable.finalY;
      // Footer bar at bottom
      doc.setFillColor(...Gray50);
      doc.setDrawColor(226, 232, 240);
      doc.rect(M, finalY + 5, pageW - M * 2, 0.3, 'F');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...Gray400);
      doc.text('Generated by Al-Sufiaan School Management System', M, finalY + 11);

      // ── Save ──
      const safe = (s: string) => s.replace(/[^a-zA-Z0-9]/g, '_');
      doc.save(`Marks_${safe(activeClass?.name ?? '')}${sectionName ? `-${safe(sectionName)}` : ''}_${safe(selectedExam.name)}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Marks Viewer</h1>
            <p className="text-sm text-gray-500 mt-0.5">Drill down to view student marks for any exam</p>
          </div>
          <SessionSelector value={selectedSessionId} onChange={handleSessionChange} />
        </div>

        {/* Summary stats — shown only when exam is selected */}
        {selectedExam && marks.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Class Average', value: avg, sub: `out of ${selectedExam.totalMarks}`, colorBg: 'bg-blue-50', colorText: 'text-blue-600' },
              { label: 'Highest', value: highest, sub: `out of ${selectedExam.totalMarks}`, colorBg: 'bg-emerald-50', colorText: 'text-emerald-600' },
              { label: 'Lowest', value: lowest, sub: `out of ${selectedExam.totalMarks}`, colorBg: 'bg-red-50', colorText: 'text-red-500' },
              { label: 'Pass / Total', value: `${passCount} / ${marks.length}`, sub: `passing ≥ ${selectedExam.passingMarks}`, colorBg: 'bg-violet-50', colorText: 'text-violet-600' },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg ${stat.colorBg} flex items-center justify-center shrink-0`}>
                  <FaListAlt className={stat.colorText} size={14} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                  <p className={`text-xl font-bold ${stat.colorText}`}>{stat.value}</p>
                  <p className="text-xs text-gray-400">{stat.sub}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Main content */}
        {selectedSessionId === null ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
            <p className="text-amber-700 font-medium text-sm">
              No active session found. Please create and activate a session first.
            </p>
          </div>
        ) : classesLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : classes.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Class list */}
            <div className="lg:col-span-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Classes ({classes.length})
              </p>
              <div className="space-y-2">
                {classes.map(cls => (
                  <button
                    key={cls.id}
                    onClick={() => setActiveClass(cls)}
                    type="button"
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-150 ${
                      activeClass?.id === cls.id
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <span className="font-semibold text-sm">{cls.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right panel */}
            <div className="lg:col-span-2">
              {activeClass && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

                  {/* Section tabs */}
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-3">{activeClass.name}</h3>
                    {sections.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {sections.map(sec => (
                          <button
                            key={sec.id}
                            onClick={() => {
                              setActiveSectionId(sec.id);
                              setSubjectId('');
                              setExamId('');
                            }}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                              activeSectionId === sec.id
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                            }`}
                          >
                            {sec.name}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No sections in this class</p>
                    )}
                  </div>

                  {/* Filter bar: Subject → Exam */}
                  {activeSectionId && (
                    <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap gap-3 bg-gray-50">
                      <select
                        value={subjectId}
                        onChange={e => {
                          setSubjectId(e.target.value ? Number(e.target.value) : '');
                          setExamId('');
                        }}
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[130px]"
                      >
                        <option value="">Subject</option>
                        {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>

                      <select
                        value={examId}
                        onChange={e => setExamId(e.target.value ? Number(e.target.value) : '')}
                        disabled={!subjectId}
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-40 min-w-[130px]"
                      >
                        <option value="">Exam</option>
                        {exams.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
                      </select>
                    </div>
                  )}

                  {/* Marks content */}
                  {!activeSectionId ? (
                    <div className="py-16 text-center">
                      <p className="text-gray-400 text-sm">Select a section to continue</p>
                    </div>
                  ) : !examId ? (
                    <div className="py-16 text-center">
                      <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3">
                        <FaListAlt className="text-blue-300" size={18} />
                      </div>
                      <p className="text-gray-500 text-sm font-medium">Select subject → exam</p>
                      <p className="text-gray-400 text-xs mt-1">Use the filters above to drill down</p>
                    </div>
                  ) : marksLoading ? (
                    <div className="flex justify-center items-center h-48">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </div>
                  ) : marks.length === 0 ? (
                    <div className="py-16 text-center">
                      <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                        <FaListAlt className="text-gray-300" size={18} />
                      </div>
                      <p className="text-gray-500 text-sm font-medium">No marks entered yet</p>
                      <p className="text-gray-400 text-xs mt-1">Marks for this exam haven't been entered yet</p>
                    </div>
                  ) : (
                    <>
                      {/* Exam info bar */}
                      <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-800">{selectedExam?.name}</p>
                        <div className="flex items-center gap-4">
                          <p className="text-xs text-gray-400">
                            Total: <span className="font-medium text-gray-600">{selectedExam?.totalMarks}</span>
                            &nbsp;&nbsp;Pass: <span className="font-medium text-gray-600">{selectedExam?.passingMarks}</span>
                          </p>
                          <button
                            onClick={downloadPDF}
                            disabled={pdfLoading}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                          >
                            {pdfLoading
                              ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              : <FiDownload size={12} />}
                            {pdfLoading ? 'Generating…' : 'Download PDF'}
                          </button>
                        </div>
                      </div>

                      {/* Table */}
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">#</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Student</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Marks</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Percentage</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Result</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {marks.map((mark, i) => {
                              const isPassed = !mark.isAbsent && mark.marksObtained !== null && selectedExam && mark.marksObtained >= selectedExam.passingMarks;
                              return (
                                <tr key={mark.id} className="hover:bg-gray-50 transition">
                                  <td className="px-6 py-3.5 text-sm text-gray-400">{i + 1}</td>
                                  <td className="px-6 py-3.5 text-sm font-semibold text-gray-800">
                                    {mark.student ? `${mark.student.firstName} ${mark.student.lastName}` : `Student #${mark.studentId}`}
                                  </td>
                                  <td className="px-6 py-3.5 text-sm text-gray-700">
                                    {mark.isAbsent ? '—' : `${mark.marksObtained} / ${selectedExam?.totalMarks}`}
                                  </td>
                                  <td className="px-6 py-3.5 text-sm text-gray-600">
                                    {mark.isAbsent ? '—' : pct(mark.marksObtained)}
                                  </td>
                                  <td className="px-6 py-3.5">
                                    {mark.isAbsent ? (
                                      <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-500 rounded-full">Absent</span>
                                    ) : isPassed ? (
                                      <span className="px-2.5 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">Pass</span>
                                    ) : (
                                      <span className="px-2.5 py-1 text-xs font-medium bg-red-100 text-red-600 rounded-full">Fail</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <FaListAlt className="text-blue-300" size={22} />
            </div>
            <p className="text-gray-700 font-semibold">No classes in this session</p>
            <p className="text-gray-400 text-sm mt-1">Create classes first to view marks</p>
          </div>
        )}
      </div>
    </div>
  );
}
