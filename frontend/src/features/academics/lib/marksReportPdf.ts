import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Exam, StudentExamMark } from '../types';
import { School } from '../../../api/school';

// Renders text using the browser's own font engine (supports Hindi/Devanagari, Arabic, etc.)
// Returns a PNG data URL for embedding in jsPDF.
const textToImage = (text: string, fontPx: number, color: string, bold: boolean, maxWidthMm: number): string => {
  const PX_PER_MM = 3.78;  // 96dpi
  const scale = 3;         // supersample for sharpness
  const w = Math.ceil(maxWidthMm * PX_PER_MM * scale);
  const h = Math.ceil(fontPx * 2.5 * scale); // extra height for Devanagari matras above baseline
  const canvas = document.createElement('canvas');
  canvas.width = w;
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

export interface MarksReportOptions {
  school: School | undefined;
  sessionName: string;
  className: string;
  sectionName: string;
  subjectName: string;
  exam: Exam;
  marks: StudentExamMark[];
}

// Generates and downloads the class marks report PDF (fee-receipt style layout).
// Shared by the Marks Viewer and the Class Tests pages so the report never diverges.
export async function generateMarksReportPdf(o: MarksReportOptions): Promise<void> {
  const { school, sessionName, className, sectionName, subjectName, exam, marks } = o;
  if (marks.length === 0) return;

  // ── Stats ──
  const presentMarks = marks.filter(m => !m.isAbsent && m.marksObtained !== null).map(m => Number(m.marksObtained));
  const avg = presentMarks.length ? (presentMarks.reduce((a, b) => a + b, 0) / presentMarks.length).toFixed(1) : '—';
  const highest = presentMarks.length ? Math.max(...presentMarks) : '—';
  const lowest = presentMarks.length ? Math.min(...presentMarks) : '—';
  const passCount = presentMarks.filter(m => m >= exam.passingMarks).length;

  const pct = (m: number | null) => {
    if (m === null) return '—';
    return `${((m / exam.totalMarks) * 100).toFixed(1)}%`;
  };

  // ── Load logo directly from Cloudinary URL (crossOrigin='anonymous' handles CORS) ──
  const logoBase64 = school?.logoUrl ? await toPngDataUrl(school.logoUrl) : null;

  // ── Sort: ranked (desc marks) then absent ──
  const presentSorted = marks
    .filter(m => !m.isAbsent && m.marksObtained !== null)
    .sort((a, b) => Number(b.marksObtained) - Number(a.marksObtained));
  const absentRows = marks.filter(m => m.isAbsent || m.marksObtained === null);
  const sortedMarks = [...presentSorted, ...absentRows];

  // ── Labels ──
  const examEventName = exam.examEvent?.name ?? '';
  const schoolName = school?.name ?? 'Al-Sufiaan School';
  const chapterNames = [...(exam.examChapters ?? [])]
    .map(ec => ec.chapter)
    .sort((a, b) => a.orderNumber - b.orderNumber)
    .map(c => `${c.orderNumber}. ${c.name}`)
    .join(',  ');

  // ── Doc setup ──
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();   // 210

  const M = 12; // margin
  const Navy: [number, number, number] = [15, 52, 96];
  const Blue: [number, number, number] = [37, 99, 235];
  const White: [number, number, number] = [255, 255, 255];
  const Gray50: [number, number, number] = [248, 250, 252];
  const Gray100: [number, number, number] = [241, 245, 249];
  const Gray400: [number, number, number] = [148, 163, 184];
  const Gray700: [number, number, number] = [51, 65, 85];

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
  if (school?.mobile) contactParts.push(`Ph: ${school.mobile}`);
  if (school?.email) contactParts.push(`Email: ${school.email}`);
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
  const panelGap = 4;
  const panelW = (pageW - M * 2 - panelGap) / 2;
  const panelH = 32;
  const panelR = 2.5;
  const textW = panelW - 10; // max text width inside panel

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
      const line = `${row.label.charAt(0) + row.label.slice(1).toLowerCase()}: ${truncate(row.value)}`;
      const imgW = textW;
      const imgH = 6;
      const imgData = textToImage(line, 9, '#1e293b', false, imgW);
      doc.addImage(imgData, 'PNG', px + 6, ry - 2, imgW, imgH);
    });
  };

  drawPanel(M, y, [
    { label: 'SESSION', value: sessionName },
    { label: 'CLASS', value: className },
    { label: 'SECTION', value: sectionName },
    { label: 'SUBJECT', value: subjectName },
  ]);

  drawPanel(M + panelW + panelGap, y, [
    ...(examEventName ? [{ label: 'Exam Event', value: examEventName }] : []),
    { label: 'Exam', value: exam.name },
    { label: 'Total Marks', value: String(exam.totalMarks) },
    { label: 'Passing Marks', value: String(exam.passingMarks) },
  ]);

  y += panelH + 6;

  // ━━━ CHAPTERS COVERED (full-width strip, class tests only) ━━━━
  if (chapterNames) {
    const stripH = 10;
    doc.setFillColor(...Gray50);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(M, y, pageW - M * 2, stripH, panelR, panelR, 'FD');
    doc.setFillColor(...Blue);
    doc.roundedRect(M, y, 2.5, stripH, panelR, panelR, 'F');
    const chLine = `Chapters: ${chapterNames.length > 110 ? chapterNames.slice(0, 109) + '…' : chapterNames}`;
    const chImgW = pageW - M * 2 - 12;
    doc.addImage(textToImage(chLine, 9, '#1e293b', false, chImgW), 'PNG', M + 6, y + 2, chImgW, 6);
    y += stripH + 6;
  }

  // ━━━ STAT CARDS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const statDefs = [
    { label: 'CLASS AVG', value: `${avg}`, sub: `/ ${exam.totalMarks}`, accent: [37, 99, 235] as [number, number, number], bg: [239, 246, 255] as [number, number, number] },
    { label: 'HIGHEST', value: String(highest), sub: 'marks', accent: [22, 163, 74] as [number, number, number], bg: [240, 253, 244] as [number, number, number] },
    { label: 'LOWEST', value: String(lowest), sub: 'marks', accent: [220, 38, 38] as [number, number, number], bg: [254, 242, 242] as [number, number, number] },
    { label: 'PASSED', value: `${passCount}`, sub: `/ ${marks.length}`, accent: [124, 58, 237] as [number, number, number], bg: [245, 243, 255] as [number, number, number] },
  ];
  const cardGap = 3;
  const cardW = (pageW - M * 2 - cardGap * 3) / 4;
  const cardH = 18;

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
      { content: 'Roll', styles: { halign: 'center' } },
      { content: 'Adm No', styles: { halign: 'center' } },
      { content: 'Student Name' },
      { content: 'Father Name' },
      { content: 'Marks', styles: { halign: 'center' } },
      { content: '%', styles: { halign: 'center' } },
      { content: 'Result', styles: { halign: 'center' } },
    ]],
    body: sortedMarks.map((mark) => {
      const isAbsent = mark.isAbsent || mark.marksObtained === null;
      const isPassed = !isAbsent && Number(mark.marksObtained) >= exam.passingMarks;
      const rollNum = mark.student?.enrollments?.[0]?.rollNumber ?? '—';
      const admNo = mark.student?.admissionNumber ?? '—';
      const studentName = mark.student ? `${mark.student.firstName} ${mark.student.lastName}` : `Student #${mark.studentId}`;
      const fatherName = mark.student?.fatherName ?? '—';
      const marksStr = isAbsent ? '—' : `${mark.marksObtained} / ${exam.totalMarks}`;
      const pctStr = isAbsent ? '—' : pct(mark.marksObtained);
      const result = isAbsent ? 'Absent' : isPassed ? 'Pass' : 'Fail';
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
      const isPassed = !isAbsent && Number(mark.marksObtained) >= exam.passingMarks;

      let bgColor: [number, number, number];
      let fgColor: [number, number, number];
      let label: string;
      if (isAbsent) { bgColor = [241, 245, 249]; fgColor = [100, 116, 139]; label = 'Absent'; }
      else if (isPassed) { bgColor = [220, 252, 231]; fgColor = [21, 128, 61]; label = 'Pass'; }
      else { bgColor = [254, 226, 226]; fgColor = [185, 28, 28]; label = 'Fail'; }

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
  doc.save(`Marks_${safe(className)}${sectionName ? `-${safe(sectionName)}` : ''}_${safe(exam.name)}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
