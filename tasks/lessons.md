# Lessons

## Marks entry: roster comes from enrollments, not the marks table

`GET /api/academic/marks` (`getMarksByExam`) originally returned only rows that
already existed in `student_exam_marks`. The web `MarksEntryPanel` builds its
student list *and* its save payload from that response, so a freshly configured
exam showed "No students enrolled in this section" with no way to enter the first
marks (chicken-and-egg). Mobile avoided it by fetching the roster separately.

**Rule:** any marks-entry surface must source its student list from
`StudentEnrollment` (section + session, `student.active = true`), then merge in
existing marks — never derive the roster from the marks table.

## DB timeouts: test from the failing side before naming a cause

On 2026-10-24 Vercel logged `connect ETIMEDOUT`. I blamed Hostinger's Remote MySQL
whitelist, but `%` (Any Host) was already set. I had also called Render "fine"
after hitting `/api/test`, which never touches the DB. Render was failing too.

**Rule:** to check if a deployment reaches the DB, hit an endpoint that queries it
(e.g. `POST /api/auth/login` with a fake `mobileNumber` should return a quick 401).
Before blaming a firewall, test the port from several networks (check-host.net
`check-tcp`) and compare with a full `SELECT 1` from the local `.env`.
