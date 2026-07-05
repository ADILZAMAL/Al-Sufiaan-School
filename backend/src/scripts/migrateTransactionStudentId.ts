/**
 * Migration: Replace Transaction.studentName / Transaction.class with Transaction.studentId
 *
 * Steps:
 *   1. Add nullable studentId column (+ FK) to Transaction, if not already present
 *   2. Backfill studentId by matching studentName -> Student (firstName + lastName) within the same school
 *   3. Report any rows that couldn't be resolved (ambiguous or no match) — these are left untouched
 *   4. Only if every row resolved: make studentId NOT NULL and drop the studentName/class columns
 *
 * Safe to run multiple times (idempotent). If step 3 finds unresolved rows, the script stops
 * before step 4 so no data is lost — fix those rows manually (or accept them and re-run with
 * FORCE_FINALIZE=true once you've decided what to do with them), then re-run.
 *
 * Run: npx ts-node src/scripts/migrateTransactionStudentId.ts
 * Finalize despite unresolved rows: FORCE_FINALIZE=true npx ts-node src/scripts/migrateTransactionStudentId.ts
 */

import 'dotenv/config';
import { QueryTypes } from 'sequelize';
import sequelize from '../config/database';

async function columnExists(table: string, column: string): Promise<boolean> {
  const [row] = await sequelize.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = '${table}' AND column_name = '${column}'`,
    { type: QueryTypes.SELECT }
  ) as any[];
  return row.cnt > 0;
}

async function addStudentIdColumn(): Promise<void> {
  if (await columnExists('Transaction', 'studentId')) {
    console.log('Step 1: studentId column already exists, skipping.');
    return;
  }
  console.log('Step 1: Adding nullable studentId column...');
  await sequelize.query(`
    ALTER TABLE \`Transaction\`
    ADD COLUMN studentId INT NULL,
    ADD CONSTRAINT fk_transaction_studentId FOREIGN KEY (studentId) REFERENCES students(id)
  `);
  console.log('  ✓ studentId column added');
}

async function backfillStudentIds(): Promise<{ resolved: number; unresolved: number }> {
  console.log('Step 2: Backfilling studentId from studentName...');

  const pairs = await sequelize.query(
    `SELECT DISTINCT schoolId, studentName FROM \`Transaction\` WHERE studentId IS NULL`,
    { type: QueryTypes.SELECT }
  ) as { schoolId: number; studentName: string }[];

  let resolved = 0;
  let unresolved = 0;

  for (const { schoolId, studentName } of pairs) {
    const matches = await sequelize.query(
      `SELECT id FROM students
       WHERE schoolId = :schoolId
         AND LOWER(TRIM(CONCAT(firstName, ' ', lastName))) = LOWER(TRIM(:studentName))`,
      { type: QueryTypes.SELECT, replacements: { schoolId, studentName } }
    ) as { id: number }[];

    if (matches.length === 1) {
      await sequelize.query(
        `UPDATE \`Transaction\` SET studentId = :studentId
         WHERE schoolId = :schoolId AND studentName = :studentName AND studentId IS NULL`,
        { replacements: { studentId: matches[0].id, schoolId, studentName } }
      );
      resolved++;
    } else {
      console.warn(
        `  ! Unresolved: schoolId=${schoolId} studentName="${studentName}" (${matches.length} matches)`
      );
      unresolved++;
    }
  }

  console.log(`  ✓ Resolved ${resolved} distinct student name(s), ${unresolved} unresolved`);
  return { resolved, unresolved };
}

async function finalize(enforceNotNull: boolean): Promise<void> {
  console.log('Step 3: Finalizing — dropping legacy columns...');
  if (enforceNotNull) {
    await sequelize.query('ALTER TABLE `Transaction` MODIFY COLUMN studentId INT NOT NULL');
    console.log('  ✓ studentId made NOT NULL');
  } else {
    console.log('  - Leaving studentId nullable (unresolved rows remain NULL)');
  }
  if (await columnExists('Transaction', 'studentName')) {
    await sequelize.query('ALTER TABLE `Transaction` DROP COLUMN studentName');
  }
  if (await columnExists('Transaction', 'class')) {
    await sequelize.query('ALTER TABLE `Transaction` DROP COLUMN class');
  }
  console.log('  ✓ Finalized');
}

async function migrate() {
  try {
    await addStudentIdColumn();
    const { unresolved } = await backfillStudentIds();

    if (unresolved > 0 && process.env.FORCE_FINALIZE !== 'true') {
      console.log(
        `\n${unresolved} row group(s) could not be matched to a student automatically.\n` +
        'Resolve them manually (UPDATE `Transaction` SET studentId = ... WHERE ...) and re-run this script, ' +
        'or re-run with FORCE_FINALIZE=true to drop the legacy columns anyway (those rows will keep studentId = NULL, ' +
        'and the Transaction.studentId model field will then be lying about non-null-ness for those rows).'
      );
      return;
    }

    await finalize(unresolved === 0);
    console.log('\nMigration complete.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

migrate();
