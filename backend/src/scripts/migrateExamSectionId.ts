/**
 * Migration: per-section class tests (exams.sectionId)
 *
 * Steps:
 *   1. Add nullable `sectionId` column to exams
 *   2. Add index (subjectId, sectionId)
 *   3. Add FK exams.sectionId → Section.id (ON DELETE SET NULL)
 *
 * Every existing exam keeps sectionId = NULL, meaning it applies to the whole
 * class (all sections) — that is how exams were created until now. Exam-event
 * papers always stay class-wide; only new class tests get a section.
 *
 * Safe to run multiple times (idempotent).
 *
 * IMPORTANT: run this BEFORE deploying the backend that reads exams.sectionId.
 *
 * Run: npx ts-node src/scripts/migrateExamSectionId.ts
 */

import 'dotenv/config';
import { QueryTypes } from 'sequelize';
import sequelize from '../config/database';

async function count(sql: string): Promise<number> {
  const [row] = (await sequelize.query(sql, { type: QueryTypes.SELECT })) as { cnt: number }[];
  return Number(row.cnt);
}

// ─── Step 1: column ──────────────────────────────────────────────────────────

async function addSectionIdColumn(): Promise<void> {
  console.log('Step 1: Adding exams.sectionId column...');
  const exists = await count(
    `SELECT COUNT(*) AS cnt FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'exams' AND column_name = 'sectionId'`
  );
  if (exists) {
    console.log('  → sectionId column already exists, skipping.');
    return;
  }
  await sequelize.query(`ALTER TABLE exams ADD COLUMN sectionId INT NULL AFTER examEventId`);
  console.log('  → sectionId column added.');
}

// ─── Step 2: index ───────────────────────────────────────────────────────────

async function addIndex(): Promise<void> {
  console.log('Step 2: Adding index exams_subject_section_index...');
  const exists = await count(
    `SELECT COUNT(*) AS cnt FROM information_schema.statistics
     WHERE table_schema = DATABASE() AND table_name = 'exams' AND index_name = 'exams_subject_section_index'`
  );
  if (exists) {
    console.log('  → Index already exists, skipping.');
    return;
  }
  await sequelize.query(`CREATE INDEX exams_subject_section_index ON exams (subjectId, sectionId)`);
  console.log('  → Index created.');
}

// ─── Step 3: foreign key ─────────────────────────────────────────────────────

async function addForeignKey(): Promise<void> {
  console.log('Step 3: Adding FK exams_section_fk...');
  const exists = await count(
    `SELECT COUNT(*) AS cnt FROM information_schema.table_constraints
     WHERE table_schema = DATABASE() AND table_name = 'exams' AND constraint_name = 'exams_section_fk'`
  );
  if (exists) {
    console.log('  → FK already exists, skipping.');
    return;
  }
  await sequelize.query(
    `ALTER TABLE exams ADD CONSTRAINT exams_section_fk
     FOREIGN KEY (sectionId) REFERENCES Section (id) ON UPDATE CASCADE ON DELETE SET NULL`
  );
  console.log('  → FK added.');
}

async function main() {
  const [{ db }] = (await sequelize.query('SELECT DATABASE() AS db', { type: QueryTypes.SELECT })) as { db: string }[];
  console.log(`Database: ${db} @ ${process.env.DB_HOST}\n`);

  await addSectionIdColumn();
  await addIndex();
  await addForeignKey();

  console.log('\nDone.');
  await sequelize.close();
}

main().catch(async error => {
  console.error('Migration failed:', error);
  await sequelize.close();
  process.exit(1);
});
