import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { academicApi } from '../../api/academics';
import { ReportContext } from '../../navigation/types';
import { queryKeys } from '../../lib/queryKeys';
import { getErrorMessage } from '../../lib/errors';
import { toast } from '../../lib/feedback';
import { useSchoolBranding } from '../../hooks/queries';
import { shareHtmlAsPdf } from '../../pdf/shareHtmlAsPdf';
import { reportCardsHtml } from '../../pdf/templates/reportCard';

/** A section's event report card plus a helper to share report cards as PDF. */
export const useEventReport = (ctx: ReportContext) => {
  const query = useQuery({
    queryKey: queryKeys.eventReport(ctx.examEventId, ctx.sectionId),
    queryFn: () =>
      academicApi.getEventReportCard({
        examEventId: ctx.examEventId,
        classId: ctx.classId,
        sectionId: ctx.sectionId,
        sessionId: ctx.sessionId,
      }),
  });
  const branding = useSchoolBranding();
  const [sharing, setSharing] = useState(false);

  const share = async (studentIds: number[], fileName: string) => {
    if (!query.data) return;
    if (!branding.data) {
      toast.error('School details are still loading', 'Try again in a moment.');
      return;
    }
    setSharing(true);
    try {
      await shareHtmlAsPdf(reportCardsHtml(query.data, studentIds, branding.data), fileName);
    } catch (error) {
      toast.error("Couldn't create the PDF", getErrorMessage(error));
    } finally {
      setSharing(false);
    }
  };

  return { query, share, sharing };
};
