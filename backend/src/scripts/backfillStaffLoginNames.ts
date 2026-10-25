/**
 * Backfill: staff-linked logins take their identity from the staff record
 *
 * Logins linked to a staff record (User.staffId) now carry the staff name (firstName, lastName NULL) and the
 * staff mobile number (their login ID), and no email of their own. Logins created before that have NULL names
 * (teachers) or hand-typed names/emails. This runs the same sync the app runs on every staff update.
 *
 * A login whose staff mobile number already belongs to another active login is skipped and listed: fix
 * one of the two numbers on the staff page, then run this again.
 *
 * Safe to run multiple times (idempotent).
 *
 * Run: npx ts-node src/scripts/backfillStaffLoginNames.ts
 */

import 'dotenv/config';
import { Op, QueryTypes } from 'sequelize';
import sequelize from '../config/database';
import '../models/index';
import User from '../models/User';
import Staff from '../models/Staff';
import { syncLoginFromStaff } from '../utils/loginAccounts';

async function main() {
  const [{ db }] = (await sequelize.query('SELECT DATABASE() AS db', { type: QueryTypes.SELECT })) as { db: string }[];
  console.log(`Database: ${db} @ ${process.env.DB_HOST}\n`);

  const logins = await User.findAll({ where: { staffId: { [Op.ne]: null } }, paranoid: false, order: [['id', 'ASC']] });
  console.log(`Staff-linked logins: ${logins.length}`);

  let updated = 0;
  const skipped: string[] = [];
  for (const login of logins) {
    const staff = await Staff.findByPk(login.staffId as number);
    if (!staff) continue;
    try {
      if (await sequelize.transaction((transaction) => syncLoginFromStaff(staff, transaction))) updated++;
    } catch (error) {
      skipped.push(`  login #${login.id} (staff #${staff.id} ${staff.name}): ${(error as Error).message}`);
    }
  }

  console.log(`Updated: ${updated}`);
  if (skipped.length) console.log(`Skipped: ${skipped.length}\n${skipped.join('\n')}`);
  console.log('\nDone.');
  await sequelize.close();
}

main().catch(async error => {
  console.error('Backfill failed:', error);
  await sequelize.close();
  process.exit(1);
});
