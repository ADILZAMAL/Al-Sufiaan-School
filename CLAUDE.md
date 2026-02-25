# Al-Sufiaan School — Claude Instructions

## Stack
- **Backend**: Node.js + TypeScript, Express, Sequelize ORM (MySQL dialect), `freezeTableName: true`
- **Frontend**: React + TypeScript, React Router v6, TailwindCSS, Vite (`VITE_BACKEND_API_BASE_URL`)
- **Auth**: JWT via `verifyToken` middleware (cookies, `credentials: 'include'`)

## Project Structure
```
Al-Sufiaan-School/
  backend/src/
    config/database.ts     — Sequelize init; all models registered here
    models/                — Sequelize models (Staff, Payslip, Student, etc.)
    controllers/           — Express controllers
    routes/                — Express routers, all mounted in index.ts
    scripts/               — One-time migration scripts (migrateStaff.ts)
  frontend/src/
    features/              — Feature-based folders (staff, payslips, students, fees, …)
    components/            — Shared UI (Toast, Dashboard layout, ProtectedRoute)
    App.tsx                — All routes defined here
```

## Key Architecture Decisions

- **Unified Staff model**: `teaching_staff` + `non_teaching_staff` merged into single `staff` table with `staffType ENUM('teaching','non-teaching')` discriminator
- **schoolId is hardcoded to `1`** in all API calls (no multi-school support yet)
- **Payslip routes** still use `/api/payslips/staff/:staffType/:staffId` (staffType preserved in payslips table)

### Staff Module
- DB table: `staff`
- `staffType` is immutable after creation
- Subject level fields (`mathematicsLevel`, `scienceLevel`, etc.) are NULL for non-teaching staff
- Role validation is done in the controller via `TEACHING_ROLES` / `NON_TEACHING_ROLES` arrays (not DB enum)

### Payslip Module
- Payslip still stores `staffType` column (informational)
- Unique index on payslips: `(staffId, month, year)`
- `PayslipGenerator` component prop: `staff: Staff`, `staffType: 'teaching'|'non-teaching'`

## API Patterns
- All API responses: `{ success: boolean, data: ..., message?: string }`
- Frontend fetch always uses `credentials: 'include'`
- `schoolId` is hardcoded to `1` everywhere

## Staff Form Pattern
Staff forms use `useStaffForm()` hook (3-step wizard):
1. Personal & Academic Info → `PersonalDetailsForm`
2. Employment (+ `SubjectLevelSelector` if teaching) → `EmploymentDetailsForm`
3. Financial → `FinancialDetailsForm`
4. `ConfirmationModal` before submit

## Important File Paths

### Backend
| File | Purpose |
|------|---------|
| `backend/src/config/database.ts` | Sequelize init + model registration |
| `backend/src/index.ts` | Express app entry, route mounting |
| `backend/src/middleware/auth.ts` | `verifyToken` JWT middleware |
| `backend/src/models/Staff.ts` | Unified staff model |
| `backend/src/models/Payslip.ts` | Payslip model |
| `backend/src/models/PayslipPayment.ts` | Payment records for payslips |
| `backend/src/models/Student.ts` | Student model |
| `backend/src/models/StudentMonthlyFee.ts` | Monthly fee records |
| `backend/src/models/Attendance.ts` | Attendance model |
| `backend/src/models/Holiday.ts` | Holiday model |
| `backend/src/controllers/staff.ts` | Staff CRUD |
| `backend/src/controllers/payslip.ts` | Payslip generation + payments |
| `backend/src/routes/staff.ts` | `/api/staff` routes |
| `backend/src/routes/payslip.ts` | `/api/payslips` routes |

### Frontend
| File | Purpose |
|------|---------|
| `frontend/src/App.tsx` | All routes |
| `frontend/src/features/staff/types/index.ts` | Staff types + constants |
| `frontend/src/features/staff/api/staff.ts` | `staffApi` client |
| `frontend/src/features/staff/hooks/useStaffForm.ts` | 3-step form state + validation |
| `frontend/src/features/staff/pages/StaffManagement.tsx` | Staff list page |
| `frontend/src/features/staff/pages/AddStaff.tsx` | Add staff (`?type=teaching\|non-teaching`) |
| `frontend/src/features/staff/pages/ViewStaffDetails.tsx` | View staff details + payslips |
| `frontend/src/features/staff/pages/EditStaffDetails.tsx` | Edit staff |
| `frontend/src/features/payslips/api/payslips.ts` | `payslipApi` client |
| `frontend/src/features/payslips/components/PayslipGenerator.tsx` | Payslip generation modal |
| `frontend/src/features/payslips/components/PayslipView.tsx` | Payslip view modal |
| `frontend/src/features/payslips/components/PayslipList.tsx` | Payslip list component |
| `frontend/src/features/students/pages/StudentPage.tsx` | Student list |
| `frontend/src/features/attendance/pages/AttendanceDashboard.tsx` | Attendance page |
| `frontend/src/components/common/Toast.tsx` | Toast notification (SUCCESS/ERROR) |
| `frontend/src/components/layout/Dashboard.tsx` | Dashboard layout with sidebar |
