# Teacher Mobile App — Expansion & Hardening

Full plan: `~/.claude/plans/when-we-uh-improve-prancy-fountain.md`

Decisions: attendance open to all teachers · class tests per section · report cards view + share PDF · foundation first.

## Phase 1A — Backend hardening
- [x] `express-async-errors` imported first in `index.ts`
- [x] `utils/httpError.ts`, `utils/date.ts`, `utils/rollNumber.ts`, `utils/teacherScope.ts`
- [x] `req.staffId` in `verifyToken`; `denyRoles` middleware
- [x] `GET /auth/validate-token` returns fresh user (401 if deleted)
- [x] Payslips: deny TEACHER on writes/admin reads; own-only reads
- [x] `/users/me` + `getUserById` exclude password
- [x] `PUT /schools/:id` requires admin auth
- [x] `bulkMarkAttendance`: try/catch, optional `date` (IST), window, dedupe, bulk upsert, 400 when all fail
- [x] `updateAttendance`: same date window
- [x] `getStudentsWithAttendance`: remove N+1, `consecutiveAbsences`, numeric roll sort
- [x] `bulkSubmitMarks`: range validation, enrollment check, teacher assignment check
- [x] `getSyllabusProgress` uses `req.schoolId`
- [x] `GET /academic/my-assignments`
- [x] Numeric roll sort in marks roster / students-by-class / boarding / report card
- [x] Backend `tsc --noEmit` + curl verification

## Phase 1B — Mobile foundation
- [x] Deps (netinfo, secure-store, haptics, updates, system-ui, vector-icons, bottom-tabs v6, react-query v5 + persist, toast, dayjs); remove unused
- [x] `src/theme`, `src/lib`, `src/components/ui`, `src/hooks`
- [x] Auth: SecureStore token, 401 → logout event, TEACHER-only, background validate
- [x] Navigation: RootNavigator + 4 tabs (Home / Attendance / Academics / Profile), real titles
- [x] Migrate Login, Home, Class/Section, StudentList, Payslips, ChangePassword
- [x] Attendance screens: send date, partial-save reconcile, unsaved guard
- [x] Delete dead code; mobile `tsc --noEmit`

## Phase 2 — Attendance history & better taking
- [x] **Before finishing:** remove `TEMP-VERIFY` dev auto-login + deep links (App.tsx, AuthContext.tsx)
- [x] `GET /attendance/history`
- [x] `useAttendanceSheet` hook (default present, undo, drafts, dirty-only save)
- [x] TakeAttendance (list/cards, date chip), Boarding rewrite
- [x] AttendanceHome, AttendanceHistory, StudentAttendance, MonthCalendar
- [x] Fix: student calendar Sundays/holidays timezone-independent (backend)

## Phase 3 — Class tests & marks
- [x] `migrateExamSectionId.ts` (run before deploy)
- [x] Exam model + teacher class-test CRUD + getExams sectionId/progress
- [x] Web ClassTestsPage section filter
- [x] Mobile MySubjects, SubjectHome, ClassTestForm, MarksEntry rewrite, ExamResults

## Phase 4 — Report cards
- [x] `utils/grading.ts`; summaries in `getEventReportCard`; web uses server fields
- [x] Mobile PDF module; ReportCardPicker, SectionReport, StudentReportCard, StudentPerformance

## Phase 5 — Polish
- [x] Home dashboard (today's attendance per section, marks to enter, upcoming holidays)
- [x] Holiday calendar screen
- [x] Dark mode (app.json automatic; StudentProfile/PayslipDetail/DatePicker moved to theme tokens)
- [x] Accessibility labels/roles/states on all new components; 44pt targets
- [x] Unit tests: mobile (jest-expo, 16) + backend (ts-jest, 10)
- [x] CI: `.github/workflows/ci.yml` (typecheck all 3 apps, run tests)
- [ ] Lint in CI — blocked by pre-existing `no-explicit-any` errors in web (ReportCardPage, OnboardSchoolDetail)

## Review

**Verification done** (local copy of the 23 Sep production dump in a throwaway MySQL; production RDS never touched)
- Backend: every rule curl-tested — attendance date window/holidays/dupes/partial failure (server stays up), IST date fix
  (`TZ=UTC` still gives IST date), payslip ownership, `/users/me` no password hash, school PUT auth (admin + onboarding
  token), marks range/enrollment/teacher-assignment checks, class-test CRUD rules, 409-on-delete-with-marks.
- Report cards: server summaries compared against the web's original algorithm on 5 real sections (169 students, ties,
  absentees) → 0 mismatches.
- Migration `migrateExamSectionId.ts`: ran twice (idempotent). Existing exams keep sectionId = NULL (whole class) —
  exams so far were created class-wide; only new class tests get a section.
- Mobile: tsc clean, 16 unit tests, iOS + Android bundles build, every new screen screenshotted on the iOS simulator in
  light + dark mode against real data; PDF templates rendered to PDF via headless Chrome.
- Not verified by hand (no UI automation available): tapping/typing flows — saving attendance/marks from the phone,
  draft-restore prompts, the share sheet. Logic for these is covered by API tests + unit tests.

**Deploy order (important)**
1. Run on the production DB **before** deploying the backend:
   `cd backend && npx ts-node src/scripts/migrateExamSectionId.ts`
   Until then any backend with this code fails on exam queries ("Unknown column sectionId").
2. Deploy backend → deploy web → build a new mobile binary (`eas build`; native modules were added in Phase 1).
3. Optional env: `SCHOOL_TZ` (default Asia/Kolkata), `ATTENDANCE_EDIT_WINDOW_DAYS` (default 7), `MOBILE_JWT_EXPIRES_IN` (default 7d).

**Exam scope (confirmed with user, 2026-09-27)**
- Every exam created so far is class-wide → migration does not backfill; old tests stay sectionId NULL ("Whole class").
- Exam events stay school-wide with papers per class (all sections share them). Events now return `classIds`
  (classes with papers), and the web + mobile report-card pickers / annual report show only events set up for the class.

**Behaviour changes to be aware of**
- Mobile login is teacher-only; admin accounts get a message to use the website.
- Teachers can now create/edit/delete class tests (own subject + section) and see report cards only for sections they teach.
- Teachers can no longer read other staff payslips or call payslip admin endpoints.
- Old installed app builds keep working (all API changes are additive/optional).
