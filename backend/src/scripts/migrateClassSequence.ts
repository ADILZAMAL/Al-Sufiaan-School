/**
 * Migration: Add sequence to Class table
 *
 * Steps:
 *   1. Add `sequence` INT NULL column (if not present)
 *   2. Backfill existing rows using the canonical pedagogical rank
 *      (NURSERY, LKG, UKG, I..XII); unrecognized names get appended
 *      after the highest known rank in use, ordered by id.
 *
 * Safe to run multiple times (idempotent) — rows that already have a
 * sequence are left untouched.
 *
 * Run: npx ts-node src/scripts/migrateClassSequence.ts
 */

import 'dotenv/config';
import { QueryTypes } from 'sequelize';
import sequelize from '../config/database';
import '../models/index';
import Class from '../models/Class';
import { getCanonicalClassRank } from '../utils/classOrder';

async function addSequenceColumn(): Promise<void> {
  console.log('Step 1: Adding sequence column...');

  const [rows] = await sequelize.query(
    `SELECT COUNT(*) AS cnt
     FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = 'class'
       AND column_name = 'sequence'`,
    { type: QueryTypes.SELECT }
  ) as any[];

  if (Number(rows.cnt) > 0) {
    console.log('  → sequence column already exists, skipping.');
    return;
  }

  await sequelize.query(`ALTER TABLE \`class\` ADD COLUMN \`sequence\` INT NULL`);
  console.log('  → sequence column added.');
}

async function backfillSequence(): Promise<void> {
  console.log('Step 2: Backfilling sequence values...');

  const classes = await Class.findAll({ order: [['id', 'ASC']] });
  const unassigned = classes.filter((c) => c.sequence == null);

  if (unassigned.length === 0) {
    console.log('  → All classes already have a sequence, skipping.');
    return;
  }

  const knownRanks = classes
    .map((c) => c.sequence ?? getCanonicalClassRank(c.name))
    .filter((rank): rank is number => rank != null);
  let nextFallback = (knownRanks.length > 0 ? Math.max(...knownRanks) : 0) + 1;

  for (const classRecord of unassigned) {
    const rank = getCanonicalClassRank(classRecord.name);
    const sequence = rank ?? nextFallback++;
    await classRecord.update({ sequence });
    console.log(`  → ${classRecord.name} (id ${classRecord.id}) → sequence ${sequence}`);
  }
}

async function main(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log('Connected to database.\n');

    await addSequenceColumn();
    await backfillSequence();

    console.log('\nMigration complete.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

main();
