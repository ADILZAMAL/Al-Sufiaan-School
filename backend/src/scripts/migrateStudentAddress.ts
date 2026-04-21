/**
 * Migration: Consolidate student address fields
 * Merges city, state, pincode into the address column, then drops those columns.
 */

import sequelize from '../config/database';
import { QueryTypes } from 'sequelize';

async function migrate() {
  const transaction = await sequelize.transaction();

  try {
    // Step 1: Merge city/state/pincode into address for rows that have them
    await sequelize.query(
      `UPDATE students
       SET address = CONCAT(address, ', ', city, ', ', state, ' - ', pincode)
       WHERE city IS NOT NULL AND city != ''`,
      { transaction }
    );

    console.log('Merged city/state/pincode into address column.');

    // Step 2: Drop the columns
    await sequelize.query('ALTER TABLE students DROP COLUMN city', { transaction });
    await sequelize.query('ALTER TABLE students DROP COLUMN state', { transaction });
    await sequelize.query('ALTER TABLE students DROP COLUMN pincode', { transaction });

    console.log('Dropped city, state, pincode columns.');

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
