/**
 * Migration script: Merge teaching_staff and non_teaching_staff into a single staff table.
 *
 * Run ONCE against the database before deploying the updated backend code:
 *   npx ts-node src/scripts/migrateStaff.ts
 *
 * PRECONDITION: Verify no email/Aadhaar collisions between the two old tables first:
 *   SELECT email FROM teaching_staff WHERE email IN (SELECT email FROM non_teaching_staff);
 *   SELECT aadhaarNumber FROM teaching_staff WHERE aadhaarNumber IN (SELECT aadhaarNumber FROM non_teaching_staff);
 *
 * The old tables (teaching_staff, non_teaching_staff) are NOT dropped — they remain as backup.
 */

import 'dotenv/config';
import { Sequelize, QueryTypes } from 'sequelize';
import { initSchoolModel } from '../models/School';
import { initUserModel } from '../models/User';
import { initStaffModel } from '../models/Staff';
import { initPayslipModel } from '../models/Payslip';
import Staff from '../models/Staff';

const sequelize = new Sequelize(
    process.env.DB_NAME || '',
    process.env.DB_USER || '',
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: false,
        define: { freezeTableName: true }
    }
);

async function migrate() {
    initSchoolModel(sequelize);
    initUserModel(sequelize);
    initStaffModel(sequelize);
    initPayslipModel(sequelize);

    // Creates the staff table if it doesn't already exist; does not touch other tables
    await sequelize.sync({ force: false });

    console.log('Starting migration...\n');

    // Check for email collisions between old tables
    const emailCollisions: any[] = await sequelize.query(
        `SELECT email FROM teaching_staff WHERE email IN (SELECT email FROM non_teaching_staff)`,
        { type: QueryTypes.SELECT }
    );
    if (emailCollisions.length > 0) {
        console.error('ERROR: Email collisions found between teaching_staff and non_teaching_staff:');
        emailCollisions.forEach(r => console.error(' -', r.email));
        console.error('Resolve these conflicts before running the migration.');
        process.exit(1);
    }

    // Check for Aadhaar collisions
    const aadhaarCollisions: any[] = await sequelize.query(
        `SELECT aadhaarNumber FROM teaching_staff WHERE aadhaarNumber IN (SELECT aadhaarNumber FROM non_teaching_staff)`,
        { type: QueryTypes.SELECT }
    );
    if (aadhaarCollisions.length > 0) {
        console.error('ERROR: Aadhaar collisions found between teaching_staff and non_teaching_staff:');
        aadhaarCollisions.forEach(r => console.error(' -', r.aadhaarNumber));
        console.error('Resolve these conflicts before running the migration.');
        process.exit(1);
    }

    console.log('No collisions found. Proceeding...\n');

    // Map: 'teaching:oldId' -> newId  and  'non-teaching:oldId' -> newId
    const idMap = new Map<string, number>();

    // Step 1: Migrate teaching staff
    const teachingRows: any[] = await sequelize.query(
        'SELECT * FROM teaching_staff',
        { type: QueryTypes.SELECT }
    );
    console.log(`Migrating ${teachingRows.length} teaching staff records...`);
    for (const row of teachingRows) {
        const created = await Staff.create({
            staffType: 'teaching',
            name: row.name,
            gender: row.gender,
            dateOfBirth: row.dateOfBirth,
            socialCategory: row.socialCategory,
            mobileNumber: row.mobileNumber,
            email: row.email,
            aadhaarNumber: row.aadhaarNumber,
            nameAsPerAadhaar: row.nameAsPerAadhaar,
            highestAcademicQualification: row.highestAcademicQualification,
            tradeDegree: row.tradeDegree,
            highestProfessionalQualification: row.highestProfessionalQualification,
            role: row.role,
            mathematicsLevel: row.mathematicsLevel,
            scienceLevel: row.scienceLevel,
            englishLevel: row.englishLevel,
            socialScienceLevel: row.socialScienceLevel,
            scheduleVIIILanguageLevel: row.scheduleVIIILanguageLevel,
            typeOfDisability: row.typeOfDisability,
            natureOfAppointment: row.natureOfAppointment,
            dateOfJoiningService: row.dateOfJoiningService,
            dateOfJoiningPresentSchool: row.dateOfJoiningPresentSchool,
            salaryPerMonth: row.salaryPerMonth,
            upiNumber: row.upiNumber,
            accountNumber: row.accountNumber,
            accountName: row.accountName,
            ifscCode: row.ifscCode,
            photoUrl: row.photoUrl,
            active: row.active,
            schoolId: row.schoolId,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        });
        idMap.set(`teaching:${row.id}`, created.id);
        console.log(`  Teaching staff: old id=${row.id} -> new id=${created.id} (${row.name})`);
    }

    // Step 2: Migrate non-teaching staff
    const nonTeachingRows: any[] = await sequelize.query(
        'SELECT * FROM non_teaching_staff',
        { type: QueryTypes.SELECT }
    );
    console.log(`\nMigrating ${nonTeachingRows.length} non-teaching staff records...`);
    for (const row of nonTeachingRows) {
        const created = await Staff.create({
            staffType: 'non-teaching',
            name: row.name,
            gender: row.gender,
            dateOfBirth: row.dateOfBirth,
            socialCategory: row.socialCategory,
            mobileNumber: row.mobileNumber,
            email: row.email,
            aadhaarNumber: row.aadhaarNumber,
            nameAsPerAadhaar: row.nameAsPerAadhaar,
            highestAcademicQualification: row.highestAcademicQualification,
            tradeDegree: row.tradeDegree,
            highestProfessionalQualification: row.highestProfessionalQualification,
            role: row.role,
            mathematicsLevel: null,
            scienceLevel: null,
            englishLevel: null,
            socialScienceLevel: null,
            scheduleVIIILanguageLevel: null,
            typeOfDisability: row.typeOfDisability,
            natureOfAppointment: row.natureOfAppointment,
            dateOfJoiningService: row.dateOfJoiningService,
            dateOfJoiningPresentSchool: row.dateOfJoiningPresentSchool,
            salaryPerMonth: row.salaryPerMonth,
            upiNumber: row.upiNumber,
            accountNumber: row.accountNumber,
            accountName: row.accountName,
            ifscCode: row.ifscCode,
            photoUrl: row.photoUrl,
            active: row.active,
            schoolId: row.schoolId,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        });
        idMap.set(`non-teaching:${row.id}`, created.id);
        console.log(`  Non-teaching staff: old id=${row.id} -> new id=${created.id} (${row.name})`);
    }

    // Step 3: Re-point Payslip.staffId to the new unified IDs
    const payslips: any[] = await sequelize.query(
        'SELECT id, staffId, staffType FROM payslips',
        { type: QueryTypes.SELECT }
    );
    console.log(`\nUpdating ${payslips.length} payslip records...`);
    for (const payslip of payslips) {
        const mapKey = `${payslip.staffType}:${payslip.staffId}`;
        const newStaffId = idMap.get(mapKey);
        if (!newStaffId) {
            console.warn(`  WARNING: No mapping found for payslip id=${payslip.id} (${mapKey}) — skipping`);
            continue;
        }
        await sequelize.query(
            'UPDATE payslips SET staffId = ? WHERE id = ?',
            { replacements: [newStaffId, payslip.id], type: QueryTypes.UPDATE }
        );
        console.log(`  Payslip id=${payslip.id}: staffId ${payslip.staffId} -> ${newStaffId}`);
    }

    // Step 4: Update the Payslip unique index from (staffId, staffType, month, year) -> (staffId, month, year)
    console.log('\nUpdating payslip unique index...');
    try {
        await sequelize.query('ALTER TABLE payslips DROP INDEX payslip_unique_staff_month');
        await sequelize.query(
            'ALTER TABLE payslips ADD UNIQUE INDEX payslip_unique_staff_month (staffId, month, year)'
        );
        console.log('  Payslip unique index updated successfully.');
    } catch (e: any) {
        console.warn('  Could not update payslip unique index automatically:', e.message);
        console.warn('  Run manually: ALTER TABLE payslips DROP INDEX payslip_unique_staff_month;');
        console.warn('  Then: ALTER TABLE payslips ADD UNIQUE INDEX payslip_unique_staff_month (staffId, month, year);');
    }

    const staffCount = await Staff.count();
    console.log(`\nMigration complete!`);
    console.log(`  Total staff in new table: ${staffCount}`);
    console.log(`  (Expected: ${teachingRows.length + nonTeachingRows.length})`);
    console.log('\nThe old teaching_staff and non_teaching_staff tables have NOT been dropped.');
    console.log('Verify the migration, then drop them manually when ready.');

    await sequelize.close();
}

migrate().catch(e => {
    console.error('Migration failed:', e);
    process.exit(1);
});
