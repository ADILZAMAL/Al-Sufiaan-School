# Mobile App — Student Profiles Feature

## Overview
Add a **Student Profiles** feature to the teacher mobile app alongside the existing attendance flow.
Teachers get a new Home Screen with two clear entry points. The student flow lets them browse
students by class/section and view or edit basic info including photo and roll number.

---

## Navigation Flow

```
Login
  └── HomeScreen
        ├── [Take Attendance]
        │     └── ClassSelection (mode: 'attendance')
        │           └── SectionSelection (mode: 'attendance')
        │                 └── AttendanceScreen  ← unchanged
        │
        └── [Student Profiles]
              └── ClassSelection (mode: 'students')
                    └── SectionSelection (mode: 'students')
                          └── StudentListScreen
                                └── StudentProfileScreen
```

---

## Phase 1 — Foundation (Types + APIs)
> No UI. Must be completed first — all other phases depend on it.

### Tasks
- [x] Run `npx expo install expo-image-picker` inside `mobile/`
- [x] Add `expo-image-picker` plugin to `mobile/app.json`
- [x] Add new types to `mobile/src/types/index.ts`
- [x] Create `mobile/src/api/student.ts`
- [x] Create `mobile/src/api/photoUpload.ts`

### Types to add (`mobile/src/types/index.ts`)
```typescript
export interface StudentEnrollment {
  id: number;
  sessionId: number;
  classId: number;
  sectionId: number | null;
  rollNumber: string | null;
  class: { id: number; name: string };
  section: { id: number; name: string } | null;
  session: { id: number; name: string; isActive: boolean };
}

export interface StudentDetail {
  id: number;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'NA';
  religion: 'Islam' | 'Hinduism' | 'Christianity' | 'Sikhism' | 'Buddhism' | 'Jainism' | 'Other';
  phone: string;
  email?: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  fatherName: string;
  fatherPhone?: string | null;
  motherName: string;
  motherPhone?: string | null;
  guardianName?: string | null;
  guardianRelation?: string | null;
  guardianPhone?: string | null;
  studentPhoto?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  enrollments: StudentEnrollment[];
}

export interface StudentUpdatePayload {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'NA';
  religion?: 'Islam' | 'Hinduism' | 'Christianity' | 'Sikhism' | 'Buddhism' | 'Jainism' | 'Other';
  phone?: string;
  email?: string | null;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  fatherName?: string;
  fatherPhone?: string | null;
  motherName?: string;
  motherPhone?: string | null;
  guardianName?: string | null;
  guardianRelation?: string | null;
  guardianPhone?: string | null;
  studentPhoto?: string | null;
}

export interface PhotoUploadResponse {
  studentPhoto?: { url: string; publicId: string; format: string; width: number; height: number; bytes: number };
}
```

### API — `mobile/src/api/student.ts`
```typescript
// GET /api/students/:id
studentApi.getById(id: number): Promise<StudentDetail>

// PUT /api/students/:id
studentApi.update(id: number, payload: StudentUpdatePayload): Promise<StudentDetail>

// PUT /api/enrollments/:id  (requires ADMIN role — teachers are ADMIN)
studentApi.updateEnrollment(enrollmentId: number, rollNumber: string | null): Promise<void>

// GET /api/students/class/:classId?sectionId=
studentApi.getBySection(classId: number, sectionId: number): Promise<Student[]>
```

### API — `mobile/src/api/photoUpload.ts`
```typescript
// POST /api/photos/upload-student-photos
// multipart/form-data, field name: studentPhoto
// Returns URL string
photoUploadApi.uploadStudentPhoto(imageUri: string): Promise<string>
```

### Files Changed
| File | Action |
|------|--------|
| `mobile/app.json` | Add expo-image-picker plugin |
| `mobile/src/types/index.ts` | Add StudentDetail, StudentUpdatePayload, StudentEnrollment, PhotoUploadResponse |
| `mobile/src/api/student.ts` | Create |
| `mobile/src/api/photoUpload.ts` | Create |

---

## Phase 2 — Home Screen + Navigation Restructure
> Depends on Phase 1. Independent of Phases 3 & 4.

### Tasks
- [x] Add `Home`, `StudentList`, `StudentProfile` to `RootStackParamList`
- [x] Add `mode` param to `ClassSelection` and `SectionSelection`
- [x] Register all new screens in `AppNavigator.tsx`
- [x] Set `Home` as the first authenticated screen
- [x] Create `mobile/src/screens/HomeScreen.tsx`
- [x] Update `mobile/src/screens/ClassSelectionScreen.tsx` to accept & forward `mode`
- [x] Update `mobile/src/screens/SectionSelectionScreen.tsx` to route by `mode`

### Updated `RootStackParamList`
```typescript
export type RootStackParamList = {
  Loading: undefined;
  Login: undefined;
  Home: undefined;
  ClassSelection: { mode: 'attendance' | 'students' };
  SectionSelection: { classId: number; className: string; mode: 'attendance' | 'students' };
  Attendance: { classId: number; sectionId: number; className: string; sectionName: string };
  StudentList: { classId: number; sectionId: number; className: string; sectionName: string };
  StudentProfile: { studentId: number; studentName: string };
};
```

### SectionSelection routing logic
```typescript
if (mode === 'attendance') {
  navigation.navigate('Attendance', { classId, sectionId, className, sectionName });
} else {
  navigation.navigate('StudentList', { classId, sectionId, className, sectionName });
}
```

### Files Changed
| File | Action |
|------|--------|
| `mobile/src/navigation/AppNavigator.tsx` | Extend param list, register screens, set Home as first |
| `mobile/src/screens/HomeScreen.tsx` | Create |
| `mobile/src/screens/ClassSelectionScreen.tsx` | Accept & forward `mode` param |
| `mobile/src/screens/SectionSelectionScreen.tsx` | Route to StudentList or Attendance by `mode` |

### UI — Home Screen
```
┌─────────────────────────────────────┐
│  🏫  Al Sufiaan School              │
├─────────────────────────────────────┤
│                                     │
│   Good morning, Ahmed 👋            │
│   Tuesday, 25 Feb 2026              │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │   📋  Take Attendance       │    │
│  │       Mark today's          │    │
│  │       attendance            │  > │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │   👤  Student Profiles      │    │
│  │       View & update         │    │
│  │       student information   │  > │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

### UI — Class Selection (header title changes by mode)
```
┌─────────────────────────────────────┐
│  ←  Student Profiles                │
├─────────────────────────────────────┤
│   Select a Class                    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  Class 1                  > │    │
│  ├─────────────────────────────┤    │
│  │  Class 2                  > │    │
│  ├─────────────────────────────┤    │
│  │  Class 3                  > │    │
│  ├─────────────────────────────┤    │
│  │  Class 4                  > │    │
│  ├─────────────────────────────┤    │
│  │  Class 5                  > │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

### UI — Section Selection
```
┌─────────────────────────────────────┐
│  ←  Class 5 — Select Section        │
├─────────────────────────────────────┤
│   Select a Section                  │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  Section A                > │    │
│  ├─────────────────────────────┤    │
│  │  Section B                > │    │
│  ├─────────────────────────────┤    │
│  │  Section C                > │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

---

## Phase 3 — Student List Screen
> Depends on Phase 1 + Phase 2. Independent of Phase 4.

### Tasks
- [x] Create `mobile/src/screens/StudentListScreen.tsx`
  - [x] Fetch students via `studentApi.getBySection(classId, sectionId)` on mount
  - [x] Client-side search filter by name
  - [x] Show photo thumbnail, full name, roll number per row
  - [x] Tap row → navigate to `StudentProfile`
  - [x] Handle loading / error / empty states

### Files Changed
| File | Action |
|------|--------|
| `mobile/src/screens/StudentListScreen.tsx` | Create |

### UI — Student List Screen
```
┌─────────────────────────────────────┐
│  ←  Class 5 — Section A             │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐    │
│  │ 🔍  Search students...      │    │
│  └─────────────────────────────┘    │
│  32 students                        │
├─────────────────────────────────────┤
│  ┌────┬──────────────────┬──────┐   │
│  │ 🖼 │ Ahmed Khan       │ R: 1 │ > │
│  ├────┼──────────────────┼──────┤   │
│  │ 🖼 │ Sara Ali         │ R: 2 │ > │
│  ├────┼──────────────────┼──────┤   │
│  │ 🖼 │ Rahul Sharma     │ R: 3 │ > │
│  ├────┼──────────────────┼──────┤   │
│  │ 🖼 │ Zara Khan        │ R: 4 │ > │
│  ├────┼──────────────────┼──────┤   │
│  │ 🖼 │ Mohammed Rafi    │ R: 5 │ > │
│  ├────┼──────────────────┼──────┤   │
│  │ 🖼 │ Priya Sharma     │ R: 6 │ > │
│  └────┴──────────────────┴──────┘   │
└─────────────────────────────────────┘
```

---

## Phase 4 — Student Profile Screen
> Depends on Phase 1 + Phase 2. Independent of Phase 3.

### Tasks
- [x] Create `mobile/src/screens/StudentProfileScreen.tsx`
  - [x] Fetch student on mount via `studentApi.getById(studentId)`
  - [x] View mode: all fields displayed as text
  - [x] Edit mode toggle via "Edit" button
  - [x] Roll number: editable, saved via `studentApi.updateEnrollment()`
  - [x] Photo: tappable in edit mode → ActionSheet → local preview → upload on Save
  - [x] Enum fields (gender, bloodGroup, religion): inline pill selectors
  - [x] Save flow (sequential): upload photo → update student → update enrollment
  - [x] Cancel: reset all state including pending photo
  - [x] Wrap in `KeyboardAvoidingView`
  - [x] 401 → call `logout()`

### State
```typescript
student: StudentDetail | null
loading: boolean
saving: boolean
uploadingPhoto: boolean
isEditMode: boolean
form: StudentUpdatePayload
pendingPhotoUri: string | null   // local URI before upload
rollNumber: string | null        // tracked separately → goes to enrollment endpoint
```

### Save Flow
```
1. if pendingPhotoUri
     → photoUploadApi.uploadStudentPhoto(pendingPhotoUri) → photoUrl
2. studentApi.update(studentId, { ...form, studentPhoto: photoUrl })
3. if rollNumber changed
     → studentApi.updateEnrollment(activeEnrollment.id, rollNumber)
4. refetch → reset state → exit edit mode → Alert 'Saved successfully'
```

### Active Enrollment Helper
```typescript
const activeEnrollment =
  student.enrollments.find(e => e.session?.isActive)
  ?? student.enrollments[0]
  ?? null;
```

### Files Changed
| File | Action |
|------|--------|
| `mobile/src/screens/StudentProfileScreen.tsx` | Create |

### UI — Student Profile (View Mode)
```
┌─────────────────────────────────────┐
│  ←  Ahmed Khan                      │
├─────────────────────────────────────┤
│                                     │
│         ┌──────────────┐            │
│         │              │            │
│         │    photo     │            │
│         │   128×128    │            │
│         └──────────────┘            │
│           Ahmed Khan                │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  Adm No: 2024-001           │    │
│  │  Class: 5    Section: A     │    │
│  └─────────────────────────────┘    │
│  Roll No        12                  │
│                                     │
│           ┌───────────┐             │
│           │   Edit    │             │
│           └───────────┘             │
│                                     │
│  ── Personal ──────────────────     │
│  First Name      Ahmed              │
│  Last Name       Khan               │
│  Date of Birth   2015-04-12         │
│  Gender          MALE               │
│  Blood Group     B+                 │
│  Religion        Islam              │
│                                     │
│  ── Contact ───────────────────     │
│  Phone           9876543210         │
│  Email           —                  │
│  Address         123 Main St        │
│  City            Mumbai             │
│  State           Maharashtra        │
│  Pincode         400001             │
│                                     │
│  ── Family ────────────────────     │
│  Father Name     Irfan Khan         │
│  Father Phone    9876500000         │
│  Mother Name     Zara Khan          │
│  Mother Phone    —                  │
│  Guardian        —                  │
└─────────────────────────────────────┘
```

### UI — Student Profile (Edit Mode)
```
┌─────────────────────────────────────┐
│  ←  Ahmed Khan                      │
├─────────────────────────────────────┤
│                                     │
│         ┌──────────────┐            │
│         │  photo   ✏️  │ ← tappable │
│         └──────────────┘            │
│        Tap to change photo          │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  Adm No: 2024-001  (locked) │    │
│  │  Class: 5  Section: A       │    │
│  └─────────────────────────────┘    │
│  Roll No   ┌──────────────────┐     │
│            │ 12               │     │
│            └──────────────────┘     │
│                                     │
│  ┌──────────┐   ┌────────────┐      │
│  │  Cancel  │   │    Save    │      │
│  └──────────┘   └────────────┘      │
│                                     │
│  ── Personal ──────────────────     │
│  First Name  ┌──────────────────┐   │
│              │ Ahmed            │   │
│              └──────────────────┘   │
│  Last Name   ┌──────────────────┐   │
│              │ Khan             │   │
│              └──────────────────┘   │
│  DOB         ┌──────────────────┐   │
│              │ 2015-04-12       │   │
│              └──────────────────┘   │
│  Gender      [ MALE ] FEMALE OTHER  │
│  Blood Group [ B+ ] A+  A-  O+  …  │
│  Religion    [ Islam ] Hindu  Chr…  │
│                                     │
│  ── Contact ───────────────────     │
│  Phone  ┌──────────────────────┐    │
│         │ 9876543210           │    │
│         └──────────────────────┘    │
│  Email  ┌──────────────────────┐    │
│         │                      │    │
│         └──────────────────────┘    │
│  Address ┌─────────────────────┐    │
│          │ 123 Main St         │    │
│          └─────────────────────┘    │
│  City   ┌──────────────────────┐    │
│         │ Mumbai               │    │
│         └──────────────────────┘    │
│  State  ┌──────────────────────┐    │
│         │ Maharashtra          │    │
│         └──────────────────────┘    │
│  Pincode ┌─────────────────────┐    │
│          │ 400001              │    │
│          └─────────────────────┘    │
│                                     │
│  ── Family ────────────────────     │
│  Father Name ┌───────────────────┐  │
│              │ Irfan Khan        │  │
│              └───────────────────┘  │
│  Father Phone ┌──────────────────┐  │
│               │ 9876500000       │  │
│               └──────────────────┘  │
│  Mother Name ┌───────────────────┐  │
│              │ Zara Khan         │  │
│              └───────────────────┘  │
│  ...                                │
└─────────────────────────────────────┘
```

### UI — Photo Change ActionSheet
```
┌─────────────────────────────────────┐
│                                     │
│  ┌─────────────────────────────┐    │
│  │   Change Student Photo      │    │
│  ├─────────────────────────────┤    │
│  │   📷  Take Photo            │    │
│  ├─────────────────────────────┤    │
│  │   🖼  Choose from Library   │    │
│  ├─────────────────────────────┤    │
│  │        Cancel               │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

---

## Reused Patterns
| Pattern | Reference File |
|---------|---------------|
| API client module shape | `mobile/src/api/attendance.ts` |
| 401 → logout handling | `mobile/src/screens/AttendanceScreen.tsx` |
| `KeyboardAvoidingView` | `mobile/src/screens/LoginScreen.tsx` |
| Shared UI components | `mobile/src/components/LoadingSpinner.tsx`, `ErrorMessage.tsx` |

---

## Verification Checklist

### Automated — Run locally
| Status | Check | Notes |
|--------|-------|-------|
| ✅ | `npx tsc --noEmit` — zero TypeScript errors | Passing |
| ⚠️ | `npx expo-doctor` — 3 pre-existing failures | None related to `expo-image-picker`. Pre-existing: `@types/react-native` direct install, Xcode 16.4 vs SDK 51 requirement, outdated deps (`react-native`, `typescript`, etc.) |

### Navigation & Flow — Requires device / simulator
| Status | Check | How to test |
|--------|-------|-------------|
| 📱 | Login → HomeScreen shows two cards | Open app after login, verify "Take Attendance" and "Student Profiles" cards appear |
| 📱 | "Take Attendance" flow works as before (no regression) | Tap Take Attendance → Class → Section → AttendanceScreen marks work normally |
| 📱 | "Student Profiles" → Class → Section → StudentList | Tap Student Profiles → select class & section → student list loads |
| 📱 | Header title changes by mode | "Take Attendance" shows `Take Attendance` in header; "Student Profiles" shows `Student Profiles` |
| 📱 | Holiday banner skipped in students mode | On a holiday, Student Profiles flow should still show classes (not holiday banner) |

### Student List Screen
| Status | Check | How to test |
|--------|-------|-------------|
| 📱 | Students load with photo / initials | Each row shows thumbnail (or blue initials circle if no photo) |
| 📱 | Search filters by name | Type partial name → list updates; clear → full list returns |
| 📱 | Student count updates with search | Count label above list reflects filtered results |
| 📱 | Empty state shows correct message | Search with no match → "No students match your search"; empty class → "No students found" |
| 📱 | Tap student row → StudentProfile opens | Tap any row → profile screen with correct student name in header |

### Student Profile — View Mode
| Status | Check | How to test |
|--------|-------|-------------|
| 📱 | All fields show values (or `—`) | Open profile → personal, contact, family fields all visible as plain text |
| 📱 | No inputs visible in view mode | No text boxes should appear |
| 📱 | Admission No, Class, Section shown in banner | Blue banner at top shows correct read-only values |
| 📱 | Student with no active enrollment shows `—` | Test with student not enrolled in any session |

### Student Profile — Edit Mode
| Status | Check | How to test |
|--------|-------|-------------|
| 📱 | "Edit" button toggles edit mode | Tap Edit → all fields become inputs, Save+Cancel buttons appear |
| 📱 | Roll number is editable | Roll No becomes TextInput; type new value |
| 📱 | Pill selectors work for Gender / Blood Group / Religion | Tap a pill → it highlights in blue; only one active at a time |
| 📱 | Cancel resets all changes | Edit fields → tap Cancel → all values revert to original |
| 📱 | Save fires PUT to `/api/students/:id` | Edit field → Save → check network request (or verify UI updates) |
| 📱 | Roll number change fires PUT to `/api/enrollments/:id` | Change roll number → Save → verify separate enrollment API call |
| 📱 | Unchanged roll number does NOT fire enrollment PUT | Save without touching roll number → only student PUT fires |

### Photo Flow — Requires physical device (camera unavailable on simulator)
| Status | Check | How to test |
|--------|-------|-------------|
| 📱 | Photo NOT tappable in view mode | Tap photo in view mode → nothing happens |
| 📱 | Photo tappable in edit mode → ActionSheet | Edit mode → tap photo → "Take Photo / Choose from Library / Cancel" appears |
| 📱 | Choose from Library → local preview shows immediately | Pick image → photo updates instantly (no upload yet) |
| 📱 | Pending photo shown with ✏️ badge | After picking, edit badge stays visible on photo |
| 📱 | Cancel clears pending photo | Pick photo → Cancel → photo reverts to original |
| 📱 | Save uploads photo first, then PUT | Save with new photo → upload request fires before student PUT |
| 📱 | Camera permission denied → Alert shown | Deny camera permission → "Permission Required" alert appears |

### Error Handling
| Status | Check | How to test |
|--------|-------|-------------|
| 📱 | 401 on student load → logout | Expire token → open profile → app navigates to Login |
| 📱 | 401 on save → logout | Expire token mid-edit → tap Save → app navigates to Login |
| 📱 | Network error on save → Alert shown | Disconnect internet → tap Save → error Alert with message |
| 📱 | Save button disabled while saving | Tap Save → button shows spinner and is non-interactive until done |
