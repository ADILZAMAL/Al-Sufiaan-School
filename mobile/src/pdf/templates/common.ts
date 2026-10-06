import type { SchoolInfo } from '../../api/school';
import { escapeHtml } from '../escapeHtml';

export interface Branding {
  school: SchoolInfo;
  logo: string | null;
}

export const baseCss = `
  @page { size: A4; margin: 14mm 12mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Roboto, 'Helvetica Neue', Arial, sans-serif; color: #111827; font-size: 11px; margin: 0; }
  .header { display: flex; align-items: center; gap: 14px; border-bottom: 2px solid #1d4ed8; padding-bottom: 10px; margin-bottom: 12px; }
  .header img { width: 58px; height: 58px; object-fit: contain; }
  .school { font-size: 18px; font-weight: 800; color: #1d4ed8; letter-spacing: 0.3px; }
  .address { color: #4b5563; font-size: 10px; margin-top: 2px; }
  .title { text-align: center; font-size: 14px; font-weight: 700; margin: 6px 0 10px; text-transform: uppercase; letter-spacing: 1px; }
  .meta { display: flex; flex-wrap: wrap; gap: 6px 18px; margin-bottom: 10px; font-size: 11px; }
  .meta b { color: #374151; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #d1d5db; padding: 5px 6px; text-align: left; }
  th { background: #eff6ff; font-weight: 700; font-size: 10px; text-transform: uppercase; color: #1e3a8a; }
  td.num, th.num { text-align: center; }
  tr:nth-child(even) td { background: #f9fafb; }
  .pass { color: #15803d; font-weight: 700; }
  .fail { color: #b91c1c; font-weight: 700; }
  .muted { color: #6b7280; }
  .stats { display: flex; gap: 8px; margin: 10px 0; }
  .stat { flex: 1; border: 1px solid #e5e7eb; border-radius: 6px; padding: 6px; text-align: center; }
  .stat .v { font-size: 15px; font-weight: 800; }
  .stat .l { font-size: 9px; color: #6b7280; text-transform: uppercase; }
  .footer { margin-top: 28px; display: flex; justify-content: space-between; font-size: 10px; color: #374151; }
  .sign { border-top: 1px solid #9ca3af; padding-top: 4px; width: 160px; text-align: center; }
  .page-break { page-break-after: always; }
`;

export const schoolHeader = ({ school, logo }: Branding) => {
  const address = [school.street, school.city, school.district, school.state, school.pincode].filter(Boolean).join(', ');
  return `
    <div class="header">
      ${logo ? `<img src="${logo}" />` : ''}
      <div>
        <div class="school">${escapeHtml(school.name)}</div>
        ${address ? `<div class="address">${escapeHtml(address)}</div>` : ''}
        ${school.udiceCode ? `<div class="address">UDISE: ${escapeHtml(school.udiceCode)}</div>` : ''}
      </div>
    </div>`;
};

export const htmlDocument = (body: string) =>
  `<!DOCTYPE html><html><head><meta charset="utf-8" /><style>${baseCss}</style></head><body>${body}</body></html>`;
