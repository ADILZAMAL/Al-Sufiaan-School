/**
 * Migration: Add attendanceType to Attendance table
 *
 * Steps:
 *   1. Add `attendanceType` ENUM column (default 'CLASS') if not present
 *   2. Backfill existing rows with 'CLASS'
 *   3. Drop old unique index (studentId, date, schoolId)
 *   4. Create new unique index (studentId, date, schoolId, attendanceType)
 *   5. Add plain index on attendanceType
 *
 * Safe to run multiple times (idempotent).
 *
 * Run: npx ts-node src/scripts/migrateAttendanceType.ts
 */

import 'dotenv/config';
import { QueryTypes } from 'sequelize';
import sequelize from '../config/database';
import '../models/index';

// ─── Step 1: Add attendanceType column ───────────────────────────────────────

async function addAttendanceTypeColumn(): Promise<void> {
  console.log('Step 1: Adding attendanceType column...');

  const [rows] = await sequelize.query(
    `SELECT COUNT(*) AS cnt
     FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = 'attendances'
       AND column_name = 'attendanceType'`,
    { type: QueryTypes.SELECT }
  ) as any[];

  if (Number(rows.cnt) > 0) {
    console.log('  → attendanceType column already exists, skipping.');
    return;
  }

  await sequelize.query(
    `ALTER TABLE attendances
     ADD COLUMN attendanceType ENUM('CLASS', 'HOSTEL', 'DAYBOARDING') NOT NULL DEFAULT 'CLASS'`
  );
  console.log('  → attendanceType column added.');
}

// ─── Step 2: Backfill existing rows ─────────────────────────────────────────

async function backfillAttendanceType(): Promise<void> {
  console.log('Step 2: Backfilling existing rows with CLASS...');

  const [result] = await sequelize.query(
    `UPDATE attendances SET attendanceType = 'CLASS' WHERE attendanceType IS NULL`,
    { type: QueryTypes.UPDATE }
  ) as any[];

  console.log(`  → Updated ${result} row(s).`);
}

// ─── Step 3: Drop old unique index ───────────────────────────────────────────

async function dropOldUniqueIndex(): Promise<void> {
  console.log('Step 3: Dropping old unique index attendances_student_date_school_unique...');

  const [rows] = await sequelize.query(
    `SELECT COUNT(*) AS cnt
     FROM information_schema.statistics
     WHERE table_schema = DATABASE()
       AND table_name = 'attendances'
       AND index_name = 'attendances_student_date_school_unique'`,
    { type: QueryTypes.SELECT }
  ) as any[];

  if (Number(rows.cnt) === 0) {
    console.log('  → Old index does not exist, skipping.');
    return;
  }

  await sequelize.query(
    `ALTER TABLE attendances DROP INDEX attendances_student_date_school_unique`
  );
  console.log('  → Old index dropped.');
}

// ─── Step 4: Create new unique index ─────────────────────────────────────────

async function createNewUniqueIndex(): Promise<void> {
  console.log('Step 4: Creating new unique index attendances_student_date_school_type_unique...');

  const [rows] = await sequelize.query(
    `SELECT COUNT(*) AS cnt
     FROM information_schema.statistics
     WHERE table_schema = DATABASE()
       AND table_name = 'attendances'
       AND index_name = 'attendances_student_date_school_type_unique'`,
    { type: QueryTypes.SELECT }
  ) as any[];

  if (Number(rows.cnt) > 0) {
    console.log('  → New unique index already exists, skipping.');
    return;
  }

  await sequelize.query(
    `ALTER TABLE attendances
     ADD UNIQUE INDEX attendances_student_date_school_type_unique (studentId, date, schoolId, attendanceType)`
  );
  console.log('  → New unique index created.');
}

// ─── Step 5: Add plain index on attendanceType ───────────────────────────────

async function addAttendanceTypeIndex(): Promise<void> {
  console.log('Step 5: Adding plain index on attendanceType...');

  const [rows] = await sequelize.query(
    `SELECT COUNT(*) AS cnt
     FROM information_schema.statistics
     WHERE table_schema = DATABASE()
       AND table_name = 'attendances'
       AND index_name = 'attendances_attendance_type_index'`,
    { type: QueryTypes.SELECT }
  ) as any[];

  if (Number(rows.cnt) > 0) {
    console.log('  → Index already exists, skipping.');
    return;
  }

  await sequelize.query(
    `ALTER TABLE attendances
     ADD INDEX attendances_attendance_type_index (attendanceType)`
  );
  console.log('  → Index created.');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log('Connected to database.\n');

    await addAttendanceTypeColumn();
    await backfillAttendanceType();
    await dropOldUniqueIndex();
    await createNewUniqueIndex();
    await addAttendanceTypeIndex();

    console.log('\nMigration complete.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

main();
