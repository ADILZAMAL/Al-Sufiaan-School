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
