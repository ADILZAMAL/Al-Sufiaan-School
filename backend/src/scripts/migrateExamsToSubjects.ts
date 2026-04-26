/**
 * Migration: Refactor exams from chapter-scoped to subject-scoped
 *
 * Steps:
 *   1. Add `subjectId` column to exams (nullable INT) if absent
 *   2. Add `examEventId` column to exams (nullable INT) if absent
 *   3. Back-populate subjectId via chapters JOIN
 *   4. Verify no nulls remain — abort if orphaned exams found
 *   5. Create `exam_events` table if absent
 *   6. Add FK: exams.subjectId → subjects(id)
 *   7. Add FK: exams.examEventId → exam_events(id) ON DELETE SET NULL
 *   8. Drop old index exams_chapter_index, add exams_subject_index + exams_event_index
 *   9. Make chapterId nullable
 *
 * Safe to run multiple times (idempotent).
 *
 * Run: npx ts-node src/scripts/migrateExamsToSubjects.ts
 */

import 'dotenv/config';
import { QueryTypes } from 'sequelize';
import sequelize from '../config/database';
import '../models/index';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function columnExists(table: string, column: string): Promise<boolean> {
  const [row] = await sequelize.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = :table AND column_name = :column`,
    { replacements: { table, column }, type: QueryTypes.SELECT }
  ) as any[];
  return Number(row.cnt) > 0;
}

async function indexExists(table: string, indexName: string): Promise<boolean> {
  const [row] = await sequelize.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.statistics
     WHERE table_schema = DATABASE() AND table_name = :table AND index_name = :indexName`,
    { replacements: { table, indexName }, type: QueryTypes.SELECT }
  ) as any[];
  return Number(row.cnt) > 0;
}

async function fkExists(table: string, fkName: string): Promise<boolean> {
  const [row] = await sequelize.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.table_constraints
     WHERE table_schema = DATABASE() AND table_name = :table
       AND constraint_name = :fkName AND constraint_type = 'FOREIGN KEY'`,
    { replacements: { table, fkName }, type: QueryTypes.SELECT }
  ) as any[];
  return Number(row.cnt) > 0;
}

async function tableExists(table: string): Promise<boolean> {
  const [row] = await sequelize.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_name = :table`,
    { replacements: { table }, type: QueryTypes.SELECT }
  ) as any[];
  return Number(row.cnt) > 0;
}

// ─── Step 1: Add subjectId column ────────────────────────────────────────────

async function addSubjectIdColumn(): Promise<void> {
  console.log('Step 1: Adding subjectId column to exams...');
  if (await columnExists('exams', 'subjectId')) {
    console.log('  → subjectId already exists, skipping.');
    return;
  }
  await sequelize.query(`ALTER TABLE exams ADD COLUMN subjectId INT NULL AFTER chapterId`);
  console.log('  → subjectId column added.');
}

// ─── Step 2: Add examEventId column ──────────────────────────────────────────

async function addExamEventIdColumn(): Promise<void> {
  console.log('Step 2: Adding examEventId column to exams...');
  if (await columnExists('exams', 'examEventId')) {
    console.log('  → examEventId already exists, skipping.');
    return;
  }
  await sequelize.query(`ALTER TABLE exams ADD COLUMN examEventId INT NULL AFTER subjectId`);
  console.log('  → examEventId column added.');
}

// ─── Step 3: Back-populate subjectId ─────────────────────────────────────────

async function backfillSubjectId(): Promise<void> {
  console.log('Step 3: Back-populating subjectId from chapters...');
  const [result] = await sequelize.query(
    `UPDATE exams e
     JOIN chapters c ON e.chapterId = c.id
     SET e.subjectId = c.subjectId
     WHERE e.subjectId IS NULL`,
    { type: QueryTypes.UPDATE }
  ) as any[];
  console.log(`  → Updated ${result} row(s).`);
}

// ─── Step 4: Verify no nulls ──────────────────────────────────────────────────

async function verifyNoNulls(): Promise<void> {
  console.log('Step 4: Verifying no null subjectId rows remain...');
  const [row] = await sequelize.query(
    `SELECT COUNT(*) AS cnt FROM exams WHERE subjectId IS NULL`,
    { type: QueryTypes.SELECT }
  ) as any[];
  const nullCount = Number(row.cnt);
  if (nullCount > 0) {
    throw new Error(
      `Migration aborted: ${nullCount} exam row(s) have a null subjectId. ` +
      `These exams have orphaned chapterIds (chapter was deleted). ` +
      `Manually fix or delete these rows before re-running this migration.`
    );
  }
  console.log('  → All exam rows have a valid subjectId.');
}

// ─── Step 5: Create exam_events table ────────────────────────────────────────

async function createExamEventsTable(): Promise<void> {
  console.log('Step 5: Creating exam_events table...');
  if (await tableExists('exam_events')) {
    console.log('  → exam_events table already exists, skipping.');
    return;
  }
  await sequelize.query(`
    CREATE TABLE exam_events (
      id        INT          NOT NULL AUTO_INCREMENT,
      name      VARCHAR(150) NOT NULL,
      sessionId INT          NOT NULL,
      schoolId  INT          NOT NULL,
      createdBy INT          NOT NULL,
      createdAt DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX exam_events_school_session_index (schoolId, sessionId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('  → exam_events table created.');
}

// ─── Step 6: Add FK exams.subjectId → subjects(id) ───────────────────────────

async function addSubjectIdFK(): Promise<void> {
  console.log('Step 6: Adding FK exams.subjectId → subjects(id)...');
  if (await fkExists('exams', 'exams_subject_fk')) {
    console.log('  → FK already exists, skipping.');
    return;
  }
  await sequelize.query(
    `ALTER TABLE exams ADD CONSTRAINT exams_subject_fk
     FOREIGN KEY (subjectId) REFERENCES subjects(id) ON UPDATE CASCADE ON DELETE CASCADE`
  );
  console.log('  → FK added.');
}

// ─── Step 7: Add FK exams.examEventId → exam_events(id) ──────────────────────

async function addExamEventIdFK(): Promise<void> {
  console.log('Step 7: Adding FK exams.examEventId → exam_events(id)...');
  if (await fkExists('exams', 'exams_exam_event_fk')) {
    console.log('  → FK already exists, skipping.');
    return;
  }
  await sequelize.query(
    `ALTER TABLE exams ADD CONSTRAINT exams_exam_event_fk
     FOREIGN KEY (examEventId) REFERENCES exam_events(id) ON UPDATE CASCADE ON DELETE SET NULL`
  );
  console.log('  → FK added.');
}

// ─── Step 8: Update indexes ───────────────────────────────────────────────────

async function updateIndexes(): Promise<void> {
  console.log('Step 8: Updating indexes...');

  // Must drop the chapterId FK before dropping the index it backs
  if (await fkExists('exams', 'exams_ibfk_1')) {
    await sequelize.query(`ALTER TABLE exams DROP FOREIGN KEY exams_ibfk_1`);
    console.log('  → Dropped FK exams_ibfk_1 (chapterId → chapters).');
  }

  if (await indexExists('exams', 'exams_chapter_index')) {
    await sequelize.query(`ALTER TABLE exams DROP INDEX exams_chapter_index`);
    console.log('  → Dropped exams_chapter_index.');
  } else {
    console.log('  → exams_chapter_index does not exist, skipping drop.');
  }

  if (!(await indexExists('exams', 'exams_subject_index'))) {
    await sequelize.query(`ALTER TABLE exams ADD INDEX exams_subject_index (subjectId)`);
    console.log('  → Created exams_subject_index.');
  } else {
    console.log('  → exams_subject_index already exists, skipping.');
  }

  if (!(await indexExists('exams', 'exams_event_index'))) {
    await sequelize.query(`ALTER TABLE exams ADD INDEX exams_event_index (examEventId)`);
    console.log('  → Created exams_event_index.');
  } else {
    console.log('  → exams_event_index already exists, skipping.');
  }
}

// ─── Step 9: Make chapterId nullable ─────────────────────────────────────────

async function makeChapterIdNullable(): Promise<void> {
  console.log('Step 9: Making chapterId nullable...');
  const [row] = await sequelize.query(
    `SELECT IS_NULLABLE FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'exams' AND column_name = 'chapterId'`,
    { type: QueryTypes.SELECT }
  ) as any[];

  if (!row) {
    console.log('  → chapterId column not found, skipping.');
    return;
  }
  if (row.IS_NULLABLE === 'YES') {
    console.log('  → chapterId is already nullable, skipping.');
    return;
  }

  await sequelize.query(`ALTER TABLE exams MODIFY COLUMN chapterId INT NULL`);
  console.log('  → chapterId is now nullable.');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log('Connected to database.\n');

    await addSubjectIdColumn();
    await addExamEventIdColumn();
    await backfillSubjectId();
    await verifyNoNulls();
    await createExamEventsTable();
    await addSubjectIdFK();
    await addExamEventIdFK();
    await updateIndexes();
    await makeChapterIdNullable();

    console.log('\nMigration complete.');
    process.exit(0);
  } catch (err) {
    console.error('\nMigration failed:', err);
    process.exit(1);
  }
}

main();
