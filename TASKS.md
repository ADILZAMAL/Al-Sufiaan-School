# Session-Based Academic Tracking — Task Breakdown

## Overview
Introduces academic sessions, session-scoped classes/sections, student enrollment per session, student promotion, and session-aware attendance + fees.

Each task is independent enough to implement and test on its own. Complete them in order.

---

## PHASE 1 — Backend Models (no DB changes yet, just code)

### Task 1.1 — Create `AcademicSession` model
- File: `backend/src/models/AcademicSession.ts`
- Table: `academic_sessions`
- Fields: `id`, `schoolId`, `name` (e.g. "2025-26"), `startDate` (DATEONLY), `endDate` (DATEONLY), `isActive` (BOOLEAN default false), `createdBy` (FK→users)
- Export `initAcademicSessionModel(sequelize)`

### Task 1.2 — Create `StudentEnrollment` model
- File: `backend/src/models/StudentEnrollment.ts`
- Table: `student_enrollments`
- Fields: `id`, `studentId` (FK→students CASCADE), `sessionId` (FK→academic_sessions RESTRICT), `classId` (FK→class RESTRICT), `sectionId` (FK→sections RESTRICT), `rollNumber` (STRING nullable), `promotedBy` (FK→users nullable SET NULL), `promotedAt` (DATE nullable)
- Unique index: `(studentId, sessionId)`
- Index: `(sessionId, classId, sectionId)`
- Export `initStudentEnrollmentModel(sequelize)`

### Task 1.3 — Add `sessionId` to `Class` model
- File: `backend/src/models/Class.ts`
- Add `sessionId INTEGER allowNull:true` to `sequelize.define()` call
- Use string reference `model: 'academic_sessions'` (avoids circular dep since Class is defined at module-load time)
- `onUpdate: CASCADE`, `onDelete: RESTRICT`

### Task 1.5 — Add `sessionId` to `Attendance` model
- File: `backend/src/models/Attendance.ts`
- Add `sessionId INTEGER allowNull:false` FK → `academic_sessions` (`RESTRICT` delete)
- Add index: `{ fields: ['sessionId'], name: 'attendances_session_index' }`

### Task 1.6 — Add `sessionId` to `StudentMonthlyFee` model
- File: `backend/src/models/StudentMonthlyFee.ts`
- Add `sessionId INTEGER allowNull:false` FK → `academic_sessions`
- Update unique index from `(studentId, calendarYear, month)` → `(studentId, sessionId, calendarYear, month)`

### Task 1.7 — Register new models in `database.ts`
- File: `backend/src/config/database.ts`
- Import and call `initAcademicSessionModel(sequelize)` and `initStudentEnrollmentModel(sequelize)`
- Place after `initStudentModel(sequelize)`, before `sequelize.sync()`

### Task 1.8 — Update `models/index.ts` — Add new associations
- File: `backend/src/models/index.ts`
- Add imports for `AcademicSession` and `StudentEnrollment`
- Add associations:
  ```
  School ↔ AcademicSession (hasMany / belongsTo)
  AcademicSession → User (creator, as: 'creator')
  AcademicSession → Class (hasMany, as: 'classes')
  AcademicSession → Section (hasMany, as: 'sections')
  AcademicSession → StudentEnrollment (hasMany, as: 'enrollments')
  AcademicSession → Attendance (hasMany, as: 'attendances')
  AcademicSession → StudentMonthlyFee (hasMany, as: 'monthlyFees')
  Class → AcademicSession (belongsTo, as: 'session')
  Section → AcademicSession (belongsTo, as: 'session')
  StudentEnrollment → Student (belongsTo, as: 'student')
  StudentEnrollment → AcademicSession (belongsTo, as: 'session')
  StudentEnrollment → Class (belongsTo, as: 'class')
  StudentEnrollment → Section (belongsTo, as: 'section')
  StudentEnrollment → User (belongsTo, foreignKey: 'promotedBy', as: 'promoter')
  Student → StudentEnrollment (hasMany, as: 'enrollments')
  ```
- Add `AcademicSession, StudentEnrollment` to the export line
- **Do NOT remove** `Student.belongsTo(Class/Section)` yet — keep until migration runs

---

## PHASE 2 — Migration Script

### Task 2.1 — Write migration script
- File: `backend/src/scripts/migrateToSessions.ts`
- Steps the script performs:
  1. Init all models + `sequelize.sync({ force: false })` — creates new tables + adds nullable columns to existing tables
  2. Create seed session: `{ name:'2025-26', startDate:'2025-04-01', endDate:'2026-03-31', isActive:true, schoolId:1, createdBy:<first admin id> }`
  3. `UPDATE class SET sessionId = <seedId> WHERE sessionId IS NULL`
  4. `UPDATE sections SET sessionId = <seedId> WHERE sessionId IS NULL`
  5. For each student WHERE classId IS NOT NULL → `INSERT student_enrollments { studentId, sessionId, classId, sectionId, rollNumber }`
  6. `UPDATE attendances SET sessionId = <seedId> WHERE sessionId IS NULL`
  7. `UPDATE StudentMonthlyFees SET sessionId = <seedId> WHERE sessionId IS NULL`
  8. Print manual SQL for operator to run AFTER verifying:
     ```sql
     ALTER TABLE class MODIFY COLUMN sessionId INT NOT NULL;
     ALTER TABLE sections MODIFY COLUMN sessionId INT NOT NULL;
     ALTER TABLE students
       DROP COLUMN classId,
       DROP COLUMN sectionId,
       DROP COLUMN rollNumber;
     DROP INDEX students_school_class_index ON students;
     ```
  9. Print verification counts

### Task 2.2 — Run migration + verify + run manual SQL
- Run: `npx ts-node src/scripts/migrateToSessions.ts`
- Verify in DB:
  ```sql
  SELECT COUNT(*) FROM student_enrollments;                         -- must equal student count
  SELECT COUNT(*) FROM attendances WHERE sessionId IS NULL;         -- must be 0
  SELECT COUNT(*) FROM StudentMonthlyFees WHERE sessionId IS NULL;  -- must be 0
  SELECT COUNT(*) FROM class WHERE sessionId IS NULL;               -- must be 0
  ```
- Run the manual ALTER TABLE SQL printed by the script

### Task 2.3 — Remove `classId`/`sectionId`/`rollNumber` from `Student` model
> **Only do this after Task 2.2 is verified**

- File: `backend/src/models/Student.ts`
  - Remove: `classId`, `sectionId`, `rollNumber` from class body + `Student.init({})`
  - Remove: `students_school_class_index` index
  - Remove imports: `Class`, `Section`
- File: `backend/src/models/index.ts`
  - Remove lines: `Student.belongsTo(Class...)`, `Student.belongsTo(Section...)`, `Class.hasMany(Student...)`, `Section.hasMany(Student...)`

---

## PHASE 3 — Backend: Session API

### Task 3.1 — Create `academicSession` controller
- File: `backend/src/controllers/academicSession.ts`
- Functions:
  - `getAllSessions` — list by schoolId, order by startDate DESC
  - `getActiveSession` — findOne where `{ schoolId, isActive: true }`
  - `getSessionById` — single session with class/section/enrollment counts
  - `createSession` — validate name + dates; check no date overlap for school; default `isActive: false`
  - `activateSession` — in a transaction: set all school sessions `isActive=false`, set this one `isActive=true`
  - `updateSession` — guard: if enrollments exist, only name is editable (not dates)
  - `deleteSession` — guard: reject if any classes/enrollments/attendance/fees reference this session

### Task 3.2 — Create `academicSession` routes + mount
- File: `backend/src/routes/academicSession.ts`
  ```
  GET    /api/sessions
  GET    /api/sessions/active
  GET    /api/sessions/:id
  POST   /api/sessions                (ADMIN+)
  PATCH  /api/sessions/:id/activate   (ADMIN+)
  PUT    /api/sessions/:id            (ADMIN+)
  DELETE /api/sessions/:id            (ADMIN+)
  ```
- Mount in the main routes file

---

## PHASE 4 — Backend: Enrollment API

### Task 4.1 — Create `studentEnrollment` controller
- File: `backend/src/controllers/studentEnrollment.ts`
- Functions:
  - `getEnrollments` — by sessionId, optional classId/sectionId filter; include student/class/section
  - `getStudentEnrollments` — full enrollment history for one student; include session/class/section
  - `enrollStudent` — validate: student is active, session exists + belongs to school, no duplicate `(studentId, sessionId)`, classId/sectionId belong to that session; set `promotedBy` + `promotedAt`
  - `updateEnrollment` — update class/section/roll within same session; validate new IDs belong to same session
  - `deleteEnrollment` — guard: no attendance or fees for this student in this session

### Task 4.2 — Create enrollment routes + mount
- File: `backend/src/routes/studentEnrollment.ts`
  ```
  GET    /api/sessions/:sessionId/enrollments
  GET    /api/students/:studentId/enrollments
  POST   /api/sessions/:sessionId/enroll       (ADMIN+)
  PUT    /api/enrollments/:id                  (ADMIN+)
  DELETE /api/enrollments/:id                  (ADMIN+)
  ```
- Mount in the main routes file

---

## PHASE 5 — Backend: Update Existing Controllers

### Task 5.1 — Update `controllers/student.ts`
- `createStudent`: after `Student.create()`, also create `StudentEnrollment` for the active session using classId/sectionId/rollNumber from request body. Return 400 if no active session exists.
- `getAllStudents`: replace `whereClause.classId/sectionId` (direct) with an enrollment join:
  ```typescript
  include: [
    { model: StudentEnrollment, as: 'enrollments',
      required: !!sessionId,
      where: sessionId ? { sessionId } : undefined,
      include: [
        { association: 'class', attributes: ['id','name'] },
        { association: 'section', attributes: ['id','name'] }
      ]
    }
  ]
  ```
  Accept optional `sessionId` query param (default to active session).
- `getStudentById`: include `enrollments` with nested class/section/session.
- `getStudentsByClass`: rewrite to query via `StudentEnrollment` (sessionId + classId + sectionId).
- `updateStudent`: remove classId/sectionId/rollNumber from update payload entirely.

### Task 5.2 — Update `controllers/attendance.ts`
- `bulkMarkAttendance`: before inserting, auto-derive session from the attendance date:
  ```typescript
  const session = await AcademicSession.findOne({
    where: {
      schoolId,
      startDate: { [Op.lte]: date },
      endDate: { [Op.gte]: date }
    }
  });
  if (!session) return sendError(res, 'No academic session covers this date', 400);
  // pass session.id as sessionId on each Attendance record
  ```
- `getAllAttendanceStats`: query class/section via `StudentEnrollment` join (keyed to session derived from date) instead of `student.classId/sectionId`.
- `getAttendanceStats`: same fix.
- `getStudentsWithAttendance`: query students via `StudentEnrollment` filtered by sessionId.

### Task 5.3 — Update `controllers/monthlyFee.ts`
- Wherever `student.classId` is read to look up `ClassFeePricing`, replace with:
  ```typescript
  const enrollment = await StudentEnrollment.findOne({
    where: { studentId: student.id, sessionId: activeSession.id }
  });
  if (!enrollment) return sendError(res, 'Student has no enrollment in active session', 400);
  const classId = enrollment.classId;
  ```
- Pass `sessionId: activeSession.id` when creating `StudentMonthlyFee` records.
- Filter fee timeline query by `sessionId` when a sessionId param is provided.

---

## PHASE 6 — Frontend: Sessions Feature

### Task 6.1 — Create API client + types
- File: `frontend/src/features/sessions/api/index.ts`
  - `academicSessionApi`: `getSessions`, `getActiveSession`, `createSession`, `activateSession`, `updateSession`, `deleteSession`
  - `enrollmentApi`: `getEnrollments`, `getStudentEnrollments`, `enrollStudent`, `updateEnrollment`, `deleteEnrollment`
- File: `frontend/src/features/sessions/types/index.ts`
  - `AcademicSession` interface: `{ id, schoolId, name, startDate, endDate, isActive, createdBy, createdAt, updatedAt }`
  - `StudentEnrollment` interface: `{ id, studentId, sessionId, classId, sectionId, rollNumber?, session?, class?, section?, promotedBy?, promotedAt? }`

### Task 6.2 — `SessionSelector` reusable component
- File: `frontend/src/features/sessions/components/SessionSelector.tsx`
- Fetches `GET /api/sessions`; shows active session with a badge
- Props: `value: number | null`, `onChange: (sessionId: number) => void`
- Used by: `StudentPage`, `AttendanceDashboard`, `StudentPromotion`

### Task 6.3 — Session Management page
- File: `frontend/src/features/sessions/pages/SessionManagement.tsx`
- Table: Session name | Start date | End date | Status (Active badge) | Actions
- Actions: Activate (with confirmation modal), Edit (name only if has enrollments), Delete (guarded)
- "New Session" button → modal with name, startDate, endDate
- Expanding a row shows list of classes + sections in that session
- Add to `App.tsx`: `{ path: 'sessions', element: <SessionManagement /> }`

### Task 6.4 — Student Promotion page
- File: `frontend/src/features/sessions/pages/StudentPromotion.tsx`
- Step 1: Select source session → class → section → see student list
- Step 2: Per student row — "Promote" button → modal:
  - Target session (dropdown)
  - Target class (dropdown, loaded from target session's classes)
  - Target section (dropdown, filtered by target class)
  - New roll number (optional)
  - Submit → `POST /api/sessions/:targetSessionId/enroll`
- Add to `App.tsx`: `{ path: 'sessions/promote', element: <StudentPromotion /> }`

---

## PHASE 7 — Frontend: Update Existing Pages

### Task 7.1 — Update student list + add student form
- `StudentPage.tsx`:
  - Add `SessionSelector` at top; default to active session
  - Pass `sessionId` to the student fetch API call
  - Show class/section from `student.enrollments[0].class.name` / `.section.name`
- `AddStudentModal`: class/section dropdowns load from the selected (active) session's classes; backend handles creating both student + enrollment in one request

### Task 7.2 — Update edit student form
- `EditStudentModal.tsx`:
  - Remove class/section/rollNumber fields from the form
  - Add "Change Class/Section" link that opens the enrollment update flow (`PUT /api/enrollments/:id`)

### Task 7.3 — Update student profile view
- `ViewStudentProfile.tsx`:
  - Add "Academic History" section — table showing all enrollments: Session | Class | Section | Roll Number

### Task 7.4 — Update attendance pages
- `AttendanceDashboard.tsx`:
  - Add `SessionSelector`; class/section dropdowns load from selected session's classes
  - Attendance marking call unchanged — backend auto-derives session from the date

### Task 7.5 — Update class/section management
- Existing class + section create/list pages: add session context
- Class creation request includes `sessionId` (from active session)
- All class/section dropdowns app-wide must be filtered by the selected session

---

## Summary Checklist

```
PHASE 1 — Models
  [ ] 1.1  Create AcademicSession model
  [ ] 1.2  Create StudentEnrollment model
  [ ] 1.3  Add sessionId to Class
  [ ] 1.4  Add sessionId to Section
  [ ] 1.5  Add sessionId to Attendance
  [ ] 1.6  Add sessionId to StudentMonthlyFee
  [ ] 1.7  Register new models in database.ts
  [ ] 1.8  Update models/index.ts associations

PHASE 2 — Migration
  [ ] 2.1  Write migration script
  [ ] 2.2  Run migration + verify + run manual ALTER SQL
  [ ] 2.3  Remove classId/sectionId/rollNumber from Student

PHASE 3 — Session API
  [ ] 3.1  Create academicSession controller
  [ ] 3.2  Create academicSession routes + mount

PHASE 4 — Enrollment API
  [ ] 4.1  Create studentEnrollment controller
  [ ] 4.2  Create enrollment routes + mount

PHASE 5 — Update Existing Backend
  [x] 5.1  Update student controller
  [x] 5.2  Update attendance controller
  [x] 5.3  Update monthlyFee controller

PHASE 6 — New Frontend Feature
  [ ] 6.1  API client + types
  [ ] 6.2  SessionSelector component
  [ ] 6.3  Session Management page
  [ ] 6.4  Student Promotion page

PHASE 7 — Update Existing Frontend
  [ ] 7.1  Student list + add form
  [ ] 7.2  Edit student form
  [ ] 7.3  Student profile
  [ ] 7.4  Attendance pages
  [ ] 7.5  Class/section management
```

---

## Key Constraints & Notes
- `Class.ts` uses `sequelize.define()` not `Model.init()` — add `sessionId` directly in that `define()` call
- Use string `'academic_sessions'` for the FK model reference in `Class.ts` (avoids circular dep at module-load time)
- `isActive` uniqueness per school is enforced in the controller, not via a DB unique constraint (MySQL has no partial unique indexes)
- **Task 2.3 must happen AFTER Task 2.2** (drop Student columns only after migration is verified)
- Phases 3–5 can proceed in parallel with each other once Phase 2 is complete
- Phases 6–7 can start once Phases 3–5 are deployed
