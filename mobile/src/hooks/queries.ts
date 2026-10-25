import { useQuery } from '@tanstack/react-query';
import { academicApi } from '../api/academics';
import { classesApi } from '../api/classes';
import { holidayApi } from '../api/holiday';
import { schoolApi } from '../api/school';
import { queryKeys } from '../lib/queryKeys';
import { useAuth } from '../context/AuthContext';

/** Shared reference-data queries. Persisted to disk so they work offline. */

const DAY = 24 * 60 * 60 * 1000;

export const useActiveSession = () =>
  useQuery({
    queryKey: queryKeys.activeSession,
    queryFn: academicApi.getActiveSession,
    staleTime: 60 * 60 * 1000,
    meta: { persist: true },
  });

/** All classes (with their sections) for the active session, in class order. */
export const useClasses = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.classes,
    queryFn: () => classesApi.getClasses(user!.schoolId),
    enabled: !!user,
    staleTime: 60 * 60 * 1000,
    gcTime: 7 * DAY,
    meta: { persist: true },
  });
};

/** The signed-in teacher's subject + section assignments. */
export const useMyAssignments = () =>
  useQuery({
    queryKey: queryKeys.myAssignments,
    queryFn: academicApi.getMyAssignments,
    staleTime: 10 * 60 * 1000,
    gcTime: 7 * DAY,
    meta: { persist: true },
  });

export const useHolidayCheck = (date: string) =>
  useQuery({
    queryKey: queryKeys.holidayCheck(date),
    queryFn: () => holidayApi.checkIsHoliday(date),
    staleTime: 60 * 60 * 1000,
    meta: { persist: true },
  });

/** School name, address and logo for PDF headers; rarely changes. */
export const useSchoolBranding = () =>
  useQuery({
    queryKey: ['school', 'branding'],
    queryFn: async () => {
      const [school, logo] = await Promise.all([schoolApi.getCurrent(), schoolApi.getLogoDataUri().catch(() => null)]);
      return { school, logo };
    },
    staleTime: Infinity,
    gcTime: 7 * DAY,
    meta: { persist: true },
  });
