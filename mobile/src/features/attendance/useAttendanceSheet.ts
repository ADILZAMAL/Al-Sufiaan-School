import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { attendanceApi } from '../../api/attendance';
import { AttendanceStatus, AttendanceType } from '../../types';
import { drafts } from '../../lib/drafts';
import { queryKeys } from '../../lib/queryKeys';

export interface SheetStudent {
  id: number;
  firstName: string;
  lastName: string;
  rollNumber: string | null;
  studentPhoto?: string | null;
  /** Status already saved on the server for this date, if any. */
  savedStatus: AttendanceStatus | null;
  consecutiveAbsences?: number;
  /** Grouping label for mixed lists, e.g. "Class 5 – A" in boarding attendance. */
  group?: string;
}

type Marks = Record<number, AttendanceStatus>;

interface Options {
  students: SheetStudent[] | undefined;
  date: string;
  attendanceType: AttendanceType;
  /** Unique per user + list + date; drafts are stored under it. */
  draftKey: string;
  editable: boolean;
}

const UNDO_LIMIT = 20;

/**
 * State for marking a list of students present/absent for one date.
 *
 * - A day with nothing saved starts with everyone Present (teachers only tap
 *   the absentees); a partly-saved day keeps its gaps visible.
 * - Only changed rows are sent. Rows the server didn't confirm stay unsaved
 *   and are reported in `failedIds`.
 * - Unsaved marks are autosaved as a draft and offered back on reopen.
 */
export const useAttendanceSheet = ({ students, date, attendanceType, draftKey, editable }: Options) => {
  const queryClient = useQueryClient();
  const [marks, setMarks] = useState<Marks>({});
  const [baseline, setBaseline] = useState<Marks>({});
  const [failedIds, setFailedIds] = useState<Set<number>>(new Set());
  const [canUndo, setCanUndo] = useState(false);
  // True once the teacher changes something (fresh-day defaults don't count)
  const [touched, setTouched] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const undoStack = useRef<Marks[]>([]);
  const initializedFor = useRef<string | null>(null);
  // Autosave waits until any existing draft has been restored or discarded
  const draftResolved = useRef(false);

  // Initialise once per list/date when the roster arrives
  useEffect(() => {
    if (!students || initializedFor.current === draftKey) return;
    initializedFor.current = draftKey;
    draftResolved.current = false;

    const saved: Marks = {};
    students.forEach(s => {
      if (s.savedStatus) saved[s.id] = s.savedStatus;
    });
    const initial: Marks = { ...saved };
    if (editable && Object.keys(saved).length === 0) {
      students.forEach(s => {
        initial[s.id] = AttendanceStatus.PRESENT;
      });
    }
    setBaseline(saved);
    setMarks(initial);
    setFailedIds(new Set());
    undoStack.current = [];
    setCanUndo(false);
    setTouched(false);

    if (!editable) {
      draftResolved.current = true;
      return;
    }

    drafts.load<Marks>(draftKey).then(draft => {
      const rosterIds = new Set(students.map(s => s.id));
      const changes = Object.entries(draft?.data ?? {})
        .map(([id, status]) => [Number(id), status] as const)
        .filter(([id, status]) => rosterIds.has(id) && initial[id] !== status);

      if (!draft || changes.length === 0) {
        draftResolved.current = true;
        return;
      }
      Alert.alert(
        'Restore unsaved attendance?',
        `You have ${changes.length} unsaved change${changes.length === 1 ? '' : 's'} from ${dayjs(draft.savedAt).format('h:mm A, D MMM')}.`,
        [
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              drafts.remove(draftKey);
              draftResolved.current = true;
            },
          },
          {
            text: 'Restore',
            onPress: () => {
              setMarks(m => ({ ...m, ...Object.fromEntries(changes) }));
              setTouched(true);
              draftResolved.current = true;
            },
          },
        ],
        { cancelable: false }
      );
    });
  }, [students, draftKey, editable, epoch]);

  const dirtyIds = useMemo(
    () => Object.keys(marks).map(Number).filter(id => marks[id] !== baseline[id]),
    [marks, baseline]
  );

  // Autosave unsaved marks (debounced)
  useEffect(() => {
    if (!editable || !draftResolved.current) return;
    const timer = setTimeout(() => {
      if (dirtyIds.length > 0) drafts.save(draftKey, marks);
      else drafts.remove(draftKey);
    }, 500);
    return () => clearTimeout(timer);
  }, [marks, dirtyIds.length, draftKey, editable]);

  const update = useCallback(
    (fn: (prev: Marks) => Marks) => {
      if (!editable) return;
      setMarks(prev => {
        const next = fn(prev);
        if (next !== prev) undoStack.current = [...undoStack.current.slice(-(UNDO_LIMIT - 1)), prev];
        return next;
      });
      setCanUndo(true);
      setTouched(true);
    },
    [editable]
  );

  const setStatus = useCallback(
    (studentId: number, status: AttendanceStatus) =>
      update(prev => (prev[studentId] === status ? prev : { ...prev, [studentId]: status })),
    [update]
  );

  const toggle = useCallback(
    (studentId: number) =>
      update(prev => ({
        ...prev,
        [studentId]: prev[studentId] === AttendanceStatus.PRESENT ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT,
      })),
    [update]
  );

  const markAll = useCallback(
    (status: AttendanceStatus) =>
      update(prev => {
        const next = { ...prev };
        students?.forEach(s => {
          next[s.id] = status;
        });
        return next;
      }),
    [update, students]
  );

  const undo = useCallback(() => {
    const previous = undoStack.current.pop();
    if (previous) setMarks(previous);
    setCanUndo(undoStack.current.length > 0);
  }, []);

  const mutation = useMutation({
    mutationFn: (rows: { studentId: number; status: AttendanceStatus }[]) =>
      attendanceApi.bulkMarkAttendance({
        date,
        attendanceType,
        attendances: rows.map(r => ({ ...r, remarks: null })),
      }),
  });

  /** Saves changed rows. Throws on network/server errors (the draft is kept). */
  const save = useCallback(async () => {
    const ids = dirtyIds;
    const response = await mutation.mutateAsync(ids.map(id => ({ studentId: id, status: marks[id] })));

    const savedIds = new Set(response.attendances.map(a => a.studentId));
    setBaseline(prev => {
      const next = { ...prev };
      response.attendances.forEach(a => {
        next[a.studentId] = a.status;
      });
      return next;
    });
    const failed = ids.filter(id => !savedIds.has(id));
    setFailedIds(new Set(failed));
    if (failed.length === 0) await drafts.remove(draftKey);
    queryClient.invalidateQueries({ queryKey: queryKeys.attendance });
    return { saved: savedIds.size, failed: failed.length };
  }, [dirtyIds, marks, mutation, draftKey, queryClient]);

  const counts = useMemo(() => {
    let present = 0;
    let absent = 0;
    students?.forEach(s => {
      if (marks[s.id] === AttendanceStatus.PRESENT) present++;
      else if (marks[s.id] === AttendanceStatus.ABSENT) absent++;
    });
    return { present, absent, unmarked: (students?.length ?? 0) - present - absent, total: students?.length ?? 0 };
  }, [marks, students]);

  const discardDraft = useCallback(() => drafts.remove(draftKey), [draftKey]);

  /** Rebuild from the latest server data (e.g. after pull-to-refresh). Drops local edits. */
  const reinitialize = useCallback(() => {
    initializedFor.current = null;
    setEpoch(e => e + 1);
  }, []);

  return {
    marks,
    baseline,
    dirtyCount: dirtyIds.length,
    /** Unsaved edits made by the teacher (not just fresh-day defaults). */
    hasUserEdits: touched && dirtyIds.length > 0,
    isDirty: (id: number) => marks[id] !== baseline[id],
    failedIds,
    counts,
    setStatus,
    toggle,
    markAll,
    undo,
    canUndo,
    save,
    saving: mutation.isPending,
    discardDraft,
    reinitialize,
  };
};
