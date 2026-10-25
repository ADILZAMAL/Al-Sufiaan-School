import { Op, Transaction } from 'sequelize';
import sequelize from '../config/database';
import User, { type UserRole } from '../models/User';
import Staff from '../models/Staff';
import { HttpError } from './httpError';
import { hashPassword } from './password';
import { validatePasswordStrength } from './passwordValidator';

/**
 * Every rule about logins (User rows) lives here, so the staff profile card and User Management behave the same.
 *
 * - Login ID is the mobile number. Staff-linked logins take their name and mobile from the staff record.
 * - A login is disabled by soft delete. It keeps its staffId, so enabling it again restores the same account and
 *   attendance, marks etc. stay linked to it.
 * - The unique indexes on mobileNumber/email also cover disabled rows: an active login keeps its identifiers,
 *   a disabled one gives them up when someone else claims them.
 */

export interface Actor {
    id: number;
    role: UserRole;
}

export interface CreateLoginInput {
    staffId?: number;
    role: UserRole;
    password: string;
    firstName?: string;
    lastName?: string | null;
    mobileNumber?: string;
    email?: string | null;
}

export type UpdateLoginInput = Partial<Pick<CreateLoginInput, 'role' | 'firstName' | 'lastName' | 'mobileNumber' | 'email'>>;

const ROLE_LABELS: Record<UserRole, string> = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Admin',
    CASHIER: 'Cashier',
    TEACHER: 'Teacher',
};

export const normalizeEmail = (email: unknown): string | null => {
    if (typeof email !== 'string') return null;
    return email.trim().toLowerCase() || null;
};

/** Super Admins manage every login; Admins only mobile-app (TEACHER) logins. Throws otherwise. */
export const assertCanManage = (actor: Actor, targetRole: UserRole) => {
    if (actor.role === 'SUPER_ADMIN') return;
    if (actor.role === 'ADMIN' && targetRole === 'TEACHER') return;
    throw new HttpError(403, `Only a Super Admin can manage ${ROLE_LABELS[targetRole]} logins`);
};

const assertStrongPassword = (password: string) => {
    const error = validatePasswordStrength(password);
    if (error) throw new HttpError(400, error);
};

// A staff-linked login's identity is the staff record's; its email stays on the staff record
const staffIdentity = (staff: Staff) =>
    ({ firstName: staff.name.trim(), lastName: null, mobileNumber: staff.mobileNumber, email: null });

const displayName = (user: User) =>
    (user as any).staff?.name || [user.firstName, user.lastName].filter(Boolean).join(' ') || `login #${user.id}`;

/**
 * Makes `mobileNumber`/`email` available for the login being saved (`excludeUserId`): an active login holding one
 * is a 400 that names it; a disabled login holding one has it cleared.
 */
export const claimLoginIdentifiers = async (
    identifiers: { mobileNumber?: string | null; email?: string | null },
    excludeUserId: number | null,
    transaction: Transaction,
) => {
    for (const field of ['mobileNumber', 'email'] as const) {
        const value = identifiers[field];
        if (!value) continue;
        const holder = await User.findOne({
            where: { [field]: value, ...(excludeUserId ? { id: { [Op.ne]: excludeUserId } } : {}) },
            include: [{ model: Staff, as: 'staff', attributes: ['name'], required: false }],
            paranoid: false,
            transaction,
        });
        if (!holder) continue;
        if (!holder.deletedAt) {
            const label = field === 'mobileNumber' ? 'Mobile number' : 'Email';
            throw new HttpError(400, `${label} ${value} is already the login of ${displayName(holder)} (${ROLE_LABELS[holder.role]})`);
        }
        await User.update({ [field]: null }, { where: { id: holder.id }, paranoid: false, transaction });
    }
};

const findLogin = async (userId: number, transaction: Transaction) => {
    const user = await User.findByPk(userId, { transaction });
    if (!user) throw new HttpError(404, 'Login not found');
    return user;
};

export const createLogin = async (actor: Actor, schoolId: number, input: CreateLoginInput) => {
    assertCanManage(actor, input.role);
    assertStrongPassword(input.password);
    const password = await hashPassword(input.password);

    return sequelize.transaction(async (transaction) => {
        if (!input.staffId) {
            if (input.role === 'TEACHER') throw new HttpError(400, 'A Teacher login must be linked to a staff member');
            const firstName = input.firstName?.trim();
            if (!firstName || !input.mobileNumber) throw new HttpError(400, 'First name and mobile number are required');
            const email = normalizeEmail(input.email);
            await claimLoginIdentifiers({ mobileNumber: input.mobileNumber, email }, null, transaction);
            return User.create({
                firstName,
                lastName: input.lastName?.trim() || null,
                mobileNumber: input.mobileNumber,
                email,
                password,
                role: input.role,
                schoolId,
            }, { transaction });
        }

        const staff = await Staff.findOne({ where: { id: input.staffId, schoolId }, transaction });
        if (!staff) throw new HttpError(404, 'Staff not found');
        if (!staff.active) throw new HttpError(400, `${staff.name} has left school`);

        const previous = await User.findOne({ where: { staffId: staff.id }, paranoid: false, transaction });
        if (previous && !previous.deletedAt) throw new HttpError(400, `${staff.name} already has a login`);
        if (previous) assertCanManage(actor, previous.role); // restoring an office account is a Super Admin action
        // Deleting a staff record nulls its login's staffId (FK SET NULL); when that person is added back
        // with the same number, reclaim the orphaned login instead of creating a second account
        const reusable = previous ?? await User.findOne({
            where: { mobileNumber: staff.mobileNumber, staffId: null, role: 'TEACHER' },
            paranoid: false,
            transaction,
        });

        await claimLoginIdentifiers({ mobileNumber: staff.mobileNumber }, reusable?.id ?? null, transaction);
        const values = { ...staffIdentity(staff), staffId: staff.id, role: input.role, password, schoolId };
        if (!reusable) return User.create(values, { transaction });
        if (reusable.deletedAt) await reusable.restore({ transaction });
        return reusable.update(values, { transaction });
    });
};

export const updateLogin = async (actor: Actor, userId: number, changes: UpdateLoginInput) =>
    sequelize.transaction(async (transaction) => {
        const user = await findLogin(userId, transaction);
        assertCanManage(actor, user.role);
        const updates: Record<string, unknown> = {};

        if (changes.role && changes.role !== user.role) {
            if (user.id === actor.id) throw new HttpError(400, 'You cannot change your own role');
            assertCanManage(actor, changes.role);
            if (changes.role === 'TEACHER' && !user.staffId) {
                throw new HttpError(400, 'A Teacher login must be linked to a staff member');
            }
            updates.role = changes.role;
        }

        const { firstName, lastName, mobileNumber, email } = changes;
        const identityChanged = [firstName, lastName, mobileNumber, email].some((v) => v !== undefined);
        if (identityChanged && user.staffId) {
            throw new HttpError(400, 'Name and mobile number come from the staff record. Change them there.');
        }
        if (firstName !== undefined) {
            if (!firstName.trim()) throw new HttpError(400, 'First name is required');
            updates.firstName = firstName.trim();
        }
        if (lastName !== undefined) updates.lastName = lastName?.trim() || null;
        if (mobileNumber !== undefined && mobileNumber !== user.mobileNumber) updates.mobileNumber = mobileNumber;
        if (email !== undefined && normalizeEmail(email) !== user.email) updates.email = normalizeEmail(email);

        await claimLoginIdentifiers(
            { mobileNumber: updates.mobileNumber as string | undefined, email: updates.email as string | null | undefined },
            user.id,
            transaction,
        );
        return user.update(updates, { transaction });
    });

export const resetLoginPassword = async (actor: Actor, userId: number, newPassword: string) => {
    assertStrongPassword(newPassword);
    const password = await hashPassword(newPassword);
    await sequelize.transaction(async (transaction) => {
        const user = await findLogin(userId, transaction);
        if (user.id === actor.id) throw new HttpError(400, 'Use Change Password to change your own password');
        assertCanManage(actor, user.role);
        await user.update({ password }, { transaction });
    });
};

export const disableLogin = async (actor: Actor, userId: number) =>
    sequelize.transaction(async (transaction) => {
        const user = await findLogin(userId, transaction);
        if (user.id === actor.id) throw new HttpError(400, 'You cannot disable your own login');
        assertCanManage(actor, user.role);
        await user.destroy({ transaction });
    });

/**
 * Keeps a staff member's login in step with the staff record. Call inside the staff update's transaction.
 * The name is copied because "marked by", "collected by" etc. read it from the login. A disabled login only gets
 * the name: its mobile is set again, and checked, when the login is enabled. Returns whether anything changed.
 */
export const syncLoginFromStaff = async (staff: Staff, transaction: Transaction) => {
    const login = await User.findOne({ where: { staffId: staff.id }, paranoid: false, transaction });
    if (!login) return false;

    const identity = staffIdentity(staff);
    const updates: Record<string, unknown> = {};
    if (login.firstName !== identity.firstName) updates.firstName = identity.firstName;
    if (login.lastName !== null) updates.lastName = null;
    if (login.email !== null) updates.email = null;
    if (!login.deletedAt && login.mobileNumber !== identity.mobileNumber) {
        await claimLoginIdentifiers({ mobileNumber: identity.mobileNumber }, login.id, transaction);
        updates.mobileNumber = identity.mobileNumber;
    }
    if (!Object.keys(updates).length) return false;
    await User.update(updates, { where: { id: login.id }, paranoid: false, transaction });
    return true;
};

/** Staff who leave lose their login in the same transaction. */
export const disableLoginForStaff = async (staffId: number, transaction: Transaction) => {
    await User.destroy({ where: { staffId }, transaction });
};
