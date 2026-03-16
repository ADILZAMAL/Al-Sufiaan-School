/**
 * Phase 4 Migration: Fee Heads Seed + Backfill
 *
 * Steps:
 *   1. ALTER TABLE StudentMonthlyFeeItems — make feeType nullable, add new columns, fix unique index
 *   2. Seed 5 default FeeHeads per school
 *   3. Migrate ClassFeePricing → FeeHeadClassPricing (Tuition Fee head)
 *   4. Backfill existing StudentMonthlyFeeItems with feeHeadId + feeHeadName
 *
 * Safe to run multiple times (idempotent).
 *
 * Run: npx ts-node src/scripts/migrateFeeHeads.ts
 */

import 'dotenv/config';
import { QueryTypes } from 'sequelize';
import sequelize from '../config/database';
import '../models/index'; // register associations
import FeeHead from '../models/FeeHead';
import FeeHeadClassPricing from '../models/FeeHeadClassPricing';
import School from '../models/School';

// ─── Step 1: ALTER TABLE StudentMonthlyFeeItems ───────────────────────────────

async function alterStudentMonthlyFeeItemsSchema(): Promise<void> {
    console.log('Step 1: Altering StudentMonthlyFeeItems schema...');

    // Make feeType nullable
    await sequelize.query(`
        ALTER TABLE StudentMonthlyFeeItems
        MODIFY COLUMN feeType ENUM(
            'TUITION_FEE','HOSTEL_FEE','TRANSPORT_FEE','ADMISSION_FEE','DAYBOARDING_FEE'
        ) NULL
    `);
    console.log('  ✓ feeType made nullable');

    // Add new columns only if they don't exist (compatible with MySQL < 8.0)
    const columnsToAdd: [string, string][] = [
        ['feeHeadId', 'INT NULL'],
        ['feeHeadName', 'VARCHAR(100) NULL'],
        ['note', 'VARCHAR(200) NULL'],
    ];
    for (const [col, def] of columnsToAdd) {
        const [rows] = await sequelize.query(`
            SELECT COUNT(*) AS cnt
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'StudentMonthlyFeeItems'
              AND column_name = '${col}'
        `, { type: QueryTypes.SELECT }) as any[];
        if (rows.cnt === 0) {
            await sequelize.query(`ALTER TABLE StudentMonthlyFeeItems ADD COLUMN ${col} ${def}`);
            console.log(`  ✓ Column ${col} added`);
        } else {
            console.log(`  - Column ${col} already exists, skipping`);
        }
    }

    // Drop old unique index on (studentMonthlyFeeId, feeType) if still present
    const [oldIndexRows] = await sequelize.query(`
        SELECT COUNT(*) AS cnt
        FROM information_schema.statistics
        WHERE table_schema = DATABASE()
          AND table_name = 'StudentMonthlyFeeItems'
          AND index_name = 'student_monthly_fee_item_unique'
          AND column_name = 'feeType'
    `, { type: QueryTypes.SELECT }) as any[];

    if (oldIndexRows.cnt > 0) {
        await sequelize.query(`
            ALTER TABLE StudentMonthlyFeeItems DROP INDEX student_monthly_fee_item_unique
        `);
        console.log('  ✓ Old unique index (studentMonthlyFeeId, feeType) dropped');
    } else {
        console.log('  - Old unique index already removed, skipping');
    }

    // Add new unique index on (studentMonthlyFeeId, feeHeadId) if not present
    const [newIndexRows] = await sequelize.query(`
        SELECT COUNT(*) AS cnt
        FROM information_schema.statistics
        WHERE table_schema = DATABASE()
          AND table_name = 'StudentMonthlyFeeItems'
          AND index_name = 'student_monthly_fee_item_unique'
          AND column_name = 'feeHeadId'
    `, { type: QueryTypes.SELECT }) as any[];

    if (newIndexRows.cnt === 0) {
        await sequelize.query(`
            ALTER TABLE StudentMonthlyFeeItems
            ADD UNIQUE INDEX student_monthly_fee_item_unique (studentMonthlyFeeId, feeHeadId)
        `);
        console.log('  ✓ New unique index (studentMonthlyFeeId, feeHeadId) created');
    } else {
        console.log('  - New unique index already exists, skipping');
    }
}

// ─── Step 2: Seed FeeHeads per school ────────────────────────────────────────

const DEFAULT_FEE_HEADS = [
    {
        name: 'Tuition Fee',
        frequency: 'MONTHLY' as const,
        pricingType: 'PER_CLASS' as const,
        applicability: 'AUTO' as const,
        flatAmount: null,
        displayOrder: 1,
        legacyType: 'TUITION_FEE',
    },
    {
        name: 'Hostel Fee',
        frequency: 'MONTHLY' as const,
        pricingType: 'FLAT' as const,
        applicability: 'OPT_IN' as const,
        displayOrder: 2,
        legacyType: 'HOSTEL_FEE',
        flatAmountField: 'hostelFee' as const,
    },
    {
        name: 'Transport Fee',
        frequency: 'MONTHLY' as const,
        pricingType: 'AREA_BASED' as const,
        applicability: 'OPT_IN' as const,
        flatAmount: null,
        displayOrder: 3,
        legacyType: 'TRANSPORT_FEE',
    },
    {
        name: 'Admission Fee',
        frequency: 'ONE_TIME' as const,
        pricingType: 'FLAT' as const,
        applicability: 'OPT_IN' as const,
        displayOrder: 4,
        legacyType: 'ADMISSION_FEE',
        flatAmountField: 'admissionFee' as const,
    },
    {
        name: 'Dayboarding Fee',
        frequency: 'MONTHLY' as const,
        pricingType: 'FLAT' as const,
        applicability: 'OPT_IN' as const,
        displayOrder: 5,
        legacyType: 'DAYBOARDING_FEE',
        flatAmountField: 'dayboardingFee' as const,
    },
];

async function seedFeeHeads(): Promise<void> {
    console.log('\nStep 2: Seeding FeeHeads per school...');

    const schools = await School.findAll();

    for (const school of schools) {
        console.log(`  School ${school.id} (${school.name}):`);

        for (const def of DEFAULT_FEE_HEADS) {
            const existing = await FeeHead.findOne({
                where: { schoolId: school.id, legacyType: def.legacyType },
            });

            if (existing) {
                console.log(`    - ${def.name} already exists, skipping`);
                continue;
            }

            const flatAmount = 'flatAmountField' in def && def.flatAmountField
                ? (school[def.flatAmountField] ?? null)
                : (def.flatAmount ?? null);

            await FeeHead.create({
                schoolId: school.id,
                name: def.name,
                frequency: def.frequency,
                pricingType: def.pricingType,
                applicability: def.applicability,
                flatAmount,
                isActive: true,
                displayOrder: def.displayOrder,
                legacyType: def.legacyType,
            });

            console.log(`    ✓ Created: ${def.name}`);
        }
    }
}

// ─── Step 3: Migrate ClassFeePricing → FeeHeadClassPricing ───────────────────

async function migrateClassFeePricing(): Promise<void> {
    console.log('\nStep 3: Migrating ClassFeePricing → FeeHeadClassPricing...');

    const [result] = await sequelize.query(`
        INSERT INTO FeeHeadClassPricing (feeHeadId, classId, schoolId, amount, isActive, createdAt, updatedAt)
        SELECT fh.id, cfp.classId, cfp.schoolId, cfp.amount, cfp.isActive, NOW(), NOW()
        FROM class_fee_pricing cfp
        INNER JOIN FeeHeads fh ON fh.schoolId = cfp.schoolId AND fh.legacyType = 'TUITION_FEE'
        WHERE NOT EXISTS (
            SELECT 1 FROM FeeHeadClassPricing fhcp
            WHERE fhcp.feeHeadId = fh.id AND fhcp.classId = cfp.classId
        )
    `) as any;

    const inserted = (result as any).affectedRows ?? 0;
    console.log(`  ✓ Migrated ${inserted} ClassFeePricing rows`);
}

// ─── Step 4: Backfill StudentMonthlyFeeItems ──────────────────────────────────

async function backfillFeeItems(): Promise<void> {
    console.log('\nStep 4: Backfilling StudentMonthlyFeeItems...');

    const [result] = await sequelize.query(`
        UPDATE StudentMonthlyFeeItems sfi
        INNER JOIN StudentMonthlyFees smf ON smf.id = sfi.studentMonthlyFeeId
        INNER JOIN FeeHeads fh ON fh.schoolId = smf.schoolId AND fh.legacyType COLLATE utf8mb4_unicode_ci = sfi.feeType
        SET sfi.feeHeadId = fh.id,
            sfi.feeHeadName = fh.name
        WHERE sfi.feeHeadId IS NULL
          AND sfi.feeType IS NOT NULL
    `) as any;

    const updated = (result as any).affectedRows ?? 0;
    console.log(`  ✓ Backfilled ${updated} fee items`);

    // Verify no unmatched rows remain
    const [unmatched] = await sequelize.query(`
        SELECT COUNT(*) AS cnt
        FROM StudentMonthlyFeeItems
        WHERE feeHeadId IS NULL AND feeType IS NOT NULL AND deletedAt IS NULL
    `, { type: QueryTypes.SELECT }) as any[];

    if (unmatched.cnt > 0) {
        console.warn(`  ⚠ ${unmatched.cnt} active rows still have no feeHeadId — check for missing FeeHead seeds`);
    } else {
        console.log('  ✓ All active fee items have feeHeadId set');
    }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    console.log('=== Fee Heads Migration ===\n');
    try {
        await sequelize.authenticate();
        console.log('Database connected\n');

        // Ensure new tables exist before running data steps
        // await FeeHead.sync();
        // await FeeHeadClassPricing.sync();

        // await alterStudentMonthlyFeeItemsSchema();
        // await seedFeeHeads();
        // await migrateClassFeePricing();
        await backfillFeeItems();

        console.log('\n=== Migration complete ===');
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

main();
