/**
 * Migration script: Migrate to session-based academic tracking.
 *
 * Run ONCE against the database AFTER Phase 1 model changes are deployed:
 *   npx ts-node src/scripts/migrateToSessions.ts
 *
 * WHAT THIS SCRIPT DOES:
 *   1. Creates academic_sessions and student_enrollments tables (if not already created by sync)
 *   2. Adds nullable sessionId column to: class, attendances, StudentMonthlyFees
 *   3. Creates seed session "2025-26" (schoolId=1, isActive=true)
 *   4. Backfills sessionId on class, attendances, StudentMonthlyFees rows
 *   5. Creates student_enrollment rows from existing students' classId/sectionId
 *   6. Prints verification counts
 *   7. Prints manual SQL to run after you verify the counts
 */

import 'dotenv/config';
import { Sequelize, QueryTypes } from 'sequelize';

const sequelize = new Sequelize(
    process.env.DB_NAME || '',
    process.env.DB_USER || '',
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: false,
        define: { freezeTableName: true },
    }
);

const SCHOOL_ID = 1;
const SEED_SESSION = { name: '2025-26', startDate: '2025-04-01', endDate: '2026-03-31' };

// ─── helper ────────────────────────────────────────────────────────────────

async function addColumnIfMissing(table: string, column: string, definition: string): Promise<void> {
    try {
        await sequelize.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
        console.log(`  ✓ Added \`${column}\` to \`${table}\``);
    } catch (e: any) {
        const isDuplicate =
            e.original?.code === 'ER_DUP_FIELDNAME' ||
            (e.message as string | undefined)?.includes('Duplicate column name');
        if (isDuplicate) {
            console.log(`  - \`${column}\` already exists in \`${table}\`, skipping`);
        } else {
            throw e;
        }
    }
}

// ─── main ──────────────────────────────────────────────────────────────────

async function migrate() {
    await sequelize.authenticate();
    console.log('Connected to database.\n');

    // ── Step 1: Create new tables ───────────────────────────────────────────
    console.log('Step 1: Creating new tables if they do not exist...');

    await sequelize.query(`
        CREATE TABLE IF NOT EXISTS academic_sessions (
            id        INT AUTO_INCREMENT PRIMARY KEY,
            schoolId  INT NOT NULL,
            name      VARCHAR(50) NOT NULL,
            startDate DATE NOT NULL,
            endDate   DATE NOT NULL,
            isActive  TINYINT(1) NOT NULL DEFAULT 0,
            createdBy INT NOT NULL,
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX academic_sessions_school_index (schoolId),
            INDEX academic_sessions_school_active_index (schoolId, isActive)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await sequelize.query(`
        CREATE TABLE IF NOT EXISTS student_enrollments (
            id         INT AUTO_INCREMENT PRIMARY KEY,
            studentId  INT NOT NULL,
            sessionId  INT NOT NULL,
            classId    INT NOT NULL,
            sectionId  INT NOT NULL,
            rollNumber VARCHAR(20) NULL,
            promotedBy INT NULL,
            promotedAt DATETIME NULL,
            createdAt  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE INDEX enrollment_student_session_unique (studentId, sessionId),
            INDEX enrollment_session_class_section_index (sessionId, classId, sectionId)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    console.log('  ✓ Tables ready\n');

    // ── Step 2: Add sessionId columns to existing tables ────────────────────
    console.log('Step 2: Adding nullable sessionId to existing tables...');
    await addColumnIfMissing('class', 'sessionId', 'INT NULL');
    await addColumnIfMissing('attendances', 'sessionId', 'INT NULL');
    await addColumnIfMissing('StudentMonthlyFees', 'sessionId', 'INT NULL');
    console.log();

    // ── Step 3: Find first admin user ───────────────────────────────────────
    console.log(`Step 3: Finding first admin user for schoolId=${SCHOOL_ID}...`);
    const [adminUser] = await sequelize.query(
        `SELECT id FROM User
         WHERE role IN ('SUPER_ADMIN', 'ADMIN') AND schoolId = ?
         ORDER BY id ASC LIMIT 1`,
        { replacements: [SCHOOL_ID], type: QueryTypes.SELECT }
    ) as any[];

    if (!adminUser) {
        console.error(`ERROR: No admin user found for schoolId=${SCHOOL_ID}. Create one first.`);
        process.exit(1);
    }
    const adminId = (adminUser as any).id;
    console.log(`  ✓ Using admin user id=${adminId}\n`);

    // ── Step 4: Create (or reuse) seed session ──────────────────────────────
    console.log(`Step 4: Creating seed session "${SEED_SESSION.name}"...`);
    const [existing] = await sequelize.query(
        `SELECT id FROM academic_sessions WHERE schoolId = ? AND name = ? LIMIT 1`,
        { replacements: [SCHOOL_ID, SEED_SESSION.name], type: QueryTypes.SELECT }
    ) as any[];

    let seedId: number;
    if (existing) {
        seedId = (existing as any).id;
        console.log(`  - Session already exists with id=${seedId}, reusing it\n`);
    } else {
        await sequelize.query(
            `INSERT INTO academic_sessions
                 (schoolId, name, startDate, endDate, isActive, createdBy, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, 1, ?, NOW(), NOW())`,
            {
                replacements: [SCHOOL_ID, SEED_SESSION.name, SEED_SESSION.startDate, SEED_SESSION.endDate, adminId],
            }
        );
        const [created] = await sequelize.query(
            `SELECT id FROM academic_sessions WHERE schoolId = ? AND name = ? LIMIT 1`,
            { replacements: [SCHOOL_ID, SEED_SESSION.name], type: QueryTypes.SELECT }
        ) as any[];
        seedId = (created as any).id;
        console.log(`  ✓ Created session "${SEED_SESSION.name}" with id=${seedId}\n`);
    }

    // ── Step 5: Backfill class.sessionId ────────────────────────────────────
    console.log('Step 5: Backfilling class.sessionId...');
    const [, classMeta]: any = await sequelize.query(
        `UPDATE \`class\` SET sessionId = ? WHERE sessionId IS NULL`,
        { replacements: [seedId] }
    );
    console.log(`  ✓ Updated ${classMeta.affectedRows} class row(s)\n`);

    // ── Step 6: Create student_enrollments ──────────────────────────────────
    console.log('Step 6: Creating student_enrollments from existing students...');
    const [, enrollMeta]: any = await sequelize.query(
        `INSERT IGNORE INTO student_enrollments
             (studentId, sessionId, classId, sectionId, rollNumber, createdAt, updatedAt)
         SELECT id, ?, classId, sectionId, rollNumber, NOW(), NOW()
         FROM students
         WHERE classId IS NOT NULL AND sectionId IS NOT NULL`,
        { replacements: [seedId] }
    );
    console.log(`  ✓ Inserted ${enrollMeta.affectedRows} enrollment row(s)\n`);

    // ── Step 7: Backfill attendances.sessionId ───────────────────────────────
    console.log('Step 7: Backfilling attendances.sessionId...');
    const [, attendMeta]: any = await sequelize.query(
        `UPDATE attendances SET sessionId = ? WHERE sessionId IS NULL`,
        { replacements: [seedId] }
    );
    console.log(`  ✓ Updated ${attendMeta.affectedRows} attendance row(s)\n`);

    // ── Step 8: Backfill StudentMonthlyFees.sessionId ────────────────────────
    console.log('Step 8: Backfilling StudentMonthlyFees.sessionId...');
    const [, feesMeta]: any = await sequelize.query(
        `UPDATE StudentMonthlyFees SET sessionId = ? WHERE sessionId IS NULL`,
        { replacements: [seedId] }
    );
    console.log(`  ✓ Updated ${feesMeta.affectedRows} fee row(s)\n`);

    // ── Step 9: Verification counts ─────────────────────────────────────────
    console.log('=== Verification Counts ===');
    const [[{ total_students }], [{ total_enrollments }], [{ null_attend }], [{ null_fees }], [{ null_class }]] =
        await Promise.all([
            sequelize.query(`SELECT COUNT(*) AS total_students   FROM students`, { type: QueryTypes.SELECT }),
            sequelize.query(`SELECT COUNT(*) AS total_enrollments FROM student_enrollments`, { type: QueryTypes.SELECT }),
            sequelize.query(`SELECT COUNT(*) AS null_attend FROM attendances WHERE sessionId IS NULL`, { type: QueryTypes.SELECT }),
            sequelize.query(`SELECT COUNT(*) AS null_fees FROM \`StudentMonthlyFees\` WHERE sessionId IS NULL`, { type: QueryTypes.SELECT }),
            sequelize.query(`SELECT COUNT(*) AS null_class FROM \`class\` WHERE sessionId IS NULL`, { type: QueryTypes.SELECT }),
        ]) as any[];

    console.log(`  Total students:                  ${total_students}`);
    console.log(`  Total enrollments:               ${total_enrollments}  (should ≈ students with classId)`);
    console.log(`  Attendances with NULL sessionId: ${null_attend}   (should be 0)`);
    console.log(`  Fees with NULL sessionId:        ${null_fees}   (should be 0)`);
    console.log(`  Classes with NULL sessionId:     ${null_class}   (should be 0)`);

    // ── Step 10: Print manual SQL ────────────────────────────────────────────
    console.log(`
=== Manual SQL — run in your MySQL client AFTER confirming counts above ===

-- 1. Enforce NOT NULL on newly backfilled columns:
ALTER TABLE \`class\` MODIFY COLUMN sessionId INT NOT NULL;
ALTER TABLE attendances MODIFY COLUMN sessionId INT NOT NULL;
ALTER TABLE StudentMonthlyFees MODIFY COLUMN sessionId INT NOT NULL;

-- 2. Add FK constraints on the new sessionId columns (optional but recommended):
ALTER TABLE \`class\`
    ADD CONSTRAINT fk_class_session FOREIGN KEY (sessionId)
    REFERENCES academic_sessions(id) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE attendances
    ADD CONSTRAINT fk_attend_session FOREIGN KEY (sessionId)
    REFERENCES academic_sessions(id) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE StudentMonthlyFees
    ADD CONSTRAINT fk_fees_session FOREIGN KEY (sessionId)
    REFERENCES academic_sessions(id) ON UPDATE CASCADE ON DELETE RESTRICT;

-- 3. Remove classId / sectionId / rollNumber from students
--    (Run ONLY after Phases 3-5 backend changes are deployed and verified):
--
-- ALTER TABLE students
--     DROP COLUMN classId,
--     DROP COLUMN sectionId,
--     DROP COLUMN rollNumber;
-- DROP INDEX students_school_class_index ON students;
`);

    await sequelize.close();
    console.log('Migration script complete.');
}

migrate().catch(e => {
    console.error('\nMigration failed:', e);
    process.exit(1);
});
