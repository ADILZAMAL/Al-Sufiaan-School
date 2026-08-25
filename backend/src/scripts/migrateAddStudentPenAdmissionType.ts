/**
 * Migration: Add penNumber and admissionType columns to students.
 */

import sequelize from '../config/database';

async function migrate() {
  const transaction = await sequelize.transaction();

  try {
    await sequelize.query(
      'ALTER TABLE students ADD COLUMN penNumber VARCHAR(11) NULL UNIQUE',
      { transaction }
    );
    console.log('Added penNumber column.');

    await sequelize.query(
      "ALTER TABLE students ADD COLUMN admissionType ENUM('FRESH','TRANSFER') NOT NULL DEFAULT 'FRESH'",
      { transaction }
    );
    console.log('Added admissionType column.');

    await transaction.commit();
    console.log('Migration complete.');
  } catch (err) {
    await transaction.rollback();
    console.error('Migration failed, rolled back:', err);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

migrate();
