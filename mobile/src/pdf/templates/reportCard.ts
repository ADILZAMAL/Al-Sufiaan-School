import dayjs from 'dayjs';
import type { EventReportCard } from '../../types';
import { escapeHtml } from '../escapeHtml';
import { Branding, htmlDocument, schoolHeader } from './common';
import { formatPct, ordinal, summaryFor } from '../../features/reports/format';

const reportCss = `
  .student { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 20px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 12px; margin-bottom: 12px; }
  .student div { font-size: 11px; } .student b { color: #374151; display: inline-block; min-width: 92px; }
  .totals { display: flex; margin-top: 12px; border: 1px solid #1d4ed8; border-radius: 8px; overflow: hidden; }
  .totals div { flex: 1; text-align: center; padding: 8px 4px; border-right: 1px solid #bfdbfe; }
  .totals div:last-child { border-right: 0; }
  .totals .v { font-size: 16px; font-weight: 800; color: #1d4ed8; } .totals .l { font-size: 9px; color: #6b7280; text-transform: uppercase; }
  .scale { margin-top: 12px; font-size: 9px; color: #6b7280; }
`;

const studentPage = (report: EventReportCard, studentId: number, branding: Branding) => {
  const student = report.students.find(s => s.studentId === studentId)!;
  const summary = summaryFor(report, studentId);
  const rows = report.subjects
    .map(subject => {
      const mark = subject.marks.find(m => m.studentId === studentId);
      const obtained = !mark || mark.isAbsent ? 'AB' : mark.marksObtained ?? '—';
      const pct = mark && !mark.isAbsent && mark.marksObtained !== null ? `${Math.round((mark.marksObtained / subject.totalMarks) * 100)}%` : '—';
      const failed = mark && !mark.isAbsent && mark.marksObtained !== null && mark.marksObtained < subject.passingMarks;
      return `<tr>
        <td>${escapeHtml(subject.subjectName)}</td>
        <td class="num">${subject.totalMarks}</td>
        <td class="num ${failed ? 'fail' : ''}">${obtained}</td>
        <td class="num">${pct}</td>
        <td class="num">${escapeHtml(mark?.grade ?? '—')}</td>
      </tr>`;
    })
    .join('');
  const scale = report.gradeScale.map(g => `${g.grade} ${g.min}%+`).join(' · ');

  return `
    ${schoolHeader(branding)}
    <div class="title">Report Card · ${escapeHtml(report.examEvent.name)}</div>
    <div class="student">
      <div><b>Student</b> ${escapeHtml(student.studentName)}</div>
      <div><b>Class</b> ${escapeHtml(report.class?.name ?? '')} – ${escapeHtml(report.section?.name ?? '')}</div>
      <div><b>Roll no.</b> ${escapeHtml(student.rollNumber ?? '—')}</div>
      <div><b>Admission no.</b> ${escapeHtml(student.admissionNumber ?? '—')}</div>
      <div><b>Father's name</b> ${escapeHtml(student.fatherName ?? '—')}</div>
      <div><b>Session</b> ${escapeHtml(report.session?.name ?? '')}</div>
    </div>
    <table>
      <thead><tr><th>Subject</th><th class="num">Max</th><th class="num">Obtained</th><th class="num">%</th><th class="num">Grade</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="totals">
      <div><div class="v">${summary ? `${summary.obtained}/${summary.maxTotal}` : '—'}</div><div class="l">Total</div></div>
      <div><div class="v">${formatPct(summary?.percentage)}</div><div class="l">Percentage</div></div>
      <div><div class="v">${escapeHtml(summary?.grade ?? '—')}</div><div class="l">Grade</div></div>
      <div><div class="v">${summary?.rank ? `${ordinal(summary.rank)}` : '—'}</div><div class="l">Position${summary?.rank ? ` of ${summary.rankOf}` : ''}</div></div>
    </div>
    <div class="scale">Grading: ${escapeHtml(scale)}</div>
    <div class="footer">
      <div class="sign">Class Teacher</div>
      <div class="sign">Principal</div>
      <div class="sign">Parent / Guardian</div>
    </div>
    <div class="muted" style="margin-top:10px;font-size:9px">Generated ${dayjs().format('D MMM YYYY')}</div>`;
};

/** One A4 page per student (pass several ids for a whole-class PDF). */
export const reportCardsHtml = (report: EventReportCard, studentIds: number[], branding: Branding) =>
  htmlDocument(
    `<style>${reportCss}</style>` +
      studentIds.map((id, i) => `<div class="${i < studentIds.length - 1 ? 'page-break' : ''}">${studentPage(report, id, branding)}</div>`).join('')
  );
