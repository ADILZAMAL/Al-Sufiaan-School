import dayjs from 'dayjs';
import { escapeHtml } from '../escapeHtml';
import { Branding, htmlDocument, schoolHeader } from './common';
import type { MarksStats, RankedRow } from '../../features/marks/marks';

interface MarksSheetInput {
  branding: Branding;
  examName: string;
  subjectName: string;
  className: string;
  sectionName: string;
  totalMarks: number;
  passingMarks: number;
  examDate?: string | null;
  teacherName?: string | null;
  rows: RankedRow[];
  stats: MarksStats;
}

/** One exam's marks for a section, highest first. */
export const marksSheetHtml = (input: MarksSheetInput) => {
  const { stats } = input;
  const rows = input.rows
    .map(r => {
      const result = r.absent ? '<span class="muted">Absent</span>' : r.passed === null ? '<span class="muted">—</span>' : r.passed ? '<span class="pass">Pass</span>' : '<span class="fail">Fail</span>';
      return `<tr>
        <td class="num">${r.rank ?? ''}</td>
        <td class="num">${escapeHtml(r.student.rollNumber ?? '')}</td>
        <td>${escapeHtml(r.student.name)}</td>
        <td class="num">${r.absent ? 'AB' : r.marks ?? ''}</td>
        <td class="num">${r.percentage != null ? `${r.percentage}%` : ''}</td>
        <td class="num">${result}</td>
      </tr>`;
    })
    .join('');

  return htmlDocument(`
    ${schoolHeader(input.branding)}
    <div class="title">Marks Sheet</div>
    <div class="meta">
      <span><b>Exam:</b> ${escapeHtml(input.examName)}</span>
      <span><b>Subject:</b> ${escapeHtml(input.subjectName)}</span>
      <span><b>Class:</b> ${escapeHtml(input.className)} – ${escapeHtml(input.sectionName)}</span>
      <span><b>Max marks:</b> ${input.totalMarks} (pass ${input.passingMarks})</span>
      ${input.examDate ? `<span><b>Date:</b> ${dayjs(input.examDate).format('D MMM YYYY')}</span>` : ''}
    </div>
    <div class="stats">
      <div class="stat"><div class="v">${stats.highest ?? '—'}</div><div class="l">Highest</div></div>
      <div class="stat"><div class="v">${stats.average ?? '—'}</div><div class="l">Average</div></div>
      <div class="stat"><div class="v">${stats.lowest ?? '—'}</div><div class="l">Lowest</div></div>
      <div class="stat"><div class="v">${stats.passed}/${stats.passed + stats.failed}</div><div class="l">Passed</div></div>
      <div class="stat"><div class="v">${stats.absent}</div><div class="l">Absent</div></div>
    </div>
    <table>
      <thead><tr><th class="num">Rank</th><th class="num">Roll</th><th>Student</th><th class="num">Marks</th><th class="num">%</th><th class="num">Result</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="footer">
      <div class="sign">${escapeHtml(input.teacherName ?? 'Subject Teacher')}</div>
      <div class="muted">Generated ${dayjs().format('D MMM YYYY, h:mm A')}</div>
    </div>
  `);
};
