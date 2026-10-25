import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { FaTimes, FaUser } from 'react-icons/fa';
import { HiOutlineExclamation, HiDeviceMobile } from 'react-icons/hi';
import { useAppContext } from '../../../providers/AppContext';
import type { UserRole } from '../../auth/types';
import { staffApi } from '../../staff/api/staff';
import { createLogin, updateLogin } from '../api';
import { LoginSummary } from '../types';
import { OFFICE_ROLES, ROLE_CONFIG, loginName } from '../roles';
import PasswordFields from './PasswordFields';
import { passwordProblem } from '../../auth/utils/passwordRules';

interface StaffPreset {
  id: number;
  name: string;
  mobileNumber: string;
}

type LoginFormModalProps = {
  onClose: () => void;
  onSaved: () => void;
  /** Opened from the staff profile: don't link back to it */
  fromStaffProfile?: boolean;
} & (
  | { mode: 'create'; staff?: StaffPreset }
  | { mode: 'edit'; login: LoginSummary }
);

const inputClass = 'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors';
const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

/**
 * The one form for adding or editing a login, used by User Management and the staff profile card.
 * Staff-linked logins take name and mobile (login ID) from the staff record; others enter them here.
 */
const LoginFormModal: React.FC<LoginFormModalProps> = (props) => {
  const { onClose, onSaved, fromStaffProfile } = props;
  const { userRole, userId } = useAppContext();
  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  const editing = props.mode === 'edit' ? props.login : null;
  const presetStaff = props.mode === 'create' ? props.staff : undefined;

  const [kind, setKind] = useState<'staff' | 'other'>(editing && !editing.staffId ? 'other' : 'staff');
  const [staffId, setStaffId] = useState<number | ''>(presetStaff?.id ?? '');
  const [role, setRole] = useState<UserRole>(editing?.role ?? 'TEACHER');
  const [firstName, setFirstName] = useState(editing?.firstName ?? '');
  const [lastName, setLastName] = useState(editing?.lastName ?? '');
  const [mobileNumber, setMobileNumber] = useState(editing?.mobileNumber ?? '');
  const [email, setEmail] = useState(editing?.email ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const linkedToStaff = editing ? !!editing.staffId : kind === 'staff';
  const isSelf = !!editing && editing.id === userId;

  // Active staff without a login, for "Add user" in User Management
  const { data: staffList } = useQuery(['staff', 'active'], () => staffApi.getAll(true), {
    enabled: props.mode === 'create' && !presetStaff && kind === 'staff',
  });
  const pickableStaff = useMemo(
    () => (staffList ?? []).filter((s) => !s.loginEnabled).sort((a, b) => a.name.localeCompare(b.name)),
    [staffList],
  );
  const pickedStaff = presetStaff ?? pickableStaff.find((s) => s.id === staffId);

  const roleOptions: UserRole[] = linkedToStaff
    ? (isSuperAdmin ? ['TEACHER', ...OFFICE_ROLES] : ['TEACHER'])
    : OFFICE_ROLES;

  const switchKind = (next: 'staff' | 'other') => {
    setKind(next);
    setRole(next === 'staff' ? 'TEACHER' : 'CASHIER');
    setError('');
  };

  const validate = (): string | null => {
    if (!roleOptions.includes(role)) return 'Choose a role';
    if (linkedToStaff && !editing && !pickedStaff) return 'Choose a staff member';
    if (!linkedToStaff) {
      if (!firstName.trim()) return 'First name is required';
      if (!/^\d{10}$/.test(mobileNumber)) return 'Mobile number must be 10 digits';
    }
    return editing ? null : passwordProblem(password, confirmPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setError('');
    setIsSaving(true);
    try {
      const identity = linkedToStaff ? {} : { firstName, lastName, mobileNumber, email };
      if (editing) {
        await updateLogin(editing.id, { role, ...identity });
      } else {
        await createLogin({ role, password, ...(linkedToStaff ? { staffId: pickedStaff!.id } : identity) });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSaving(false);
    }
  };

  const title = editing ? 'Edit Login' : presetStaff ? `Enable Login — ${presetStaff.name}` : 'Add User';

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <FaUser className="text-blue-600 text-sm" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">{title}</h3>
              {editing && <p className="text-xs text-gray-400">{loginName(editing)}</p>}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-3">
              <HiOutlineExclamation className="text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Who: a staff member, or someone not on staff (owner, office) */}
          {props.mode === 'create' && !presetStaff && (
            <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-lg">
              {(['staff', 'other'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => switchKind(k)}
                  className={`py-2 text-sm rounded-md transition ${kind === k ? 'bg-white shadow-sm font-medium text-gray-900' : 'text-gray-500'}`}
                >
                  {k === 'staff' ? 'Staff member' : 'Not on staff'}
                </button>
              ))}
            </div>
          )}

          {linkedToStaff && props.mode === 'create' && !presetStaff && (
            <div>
              <label className={labelClass}>Staff member <span className="text-red-500">*</span></label>
              <select
                value={staffId}
                onChange={(e) => setStaffId(e.target.value ? Number(e.target.value) : '')}
                className={inputClass}
              >
                <option value="">Select staff member</option>
                {pickableStaff.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} · {s.mobileNumber}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">Only active staff without a login are listed.</p>
            </div>
          )}

          {linkedToStaff && (pickedStaff || editing) && (
            <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
              <HiDeviceMobile className="text-blue-500 w-4 h-4 mt-0.5 shrink-0" />
              <div className="text-sm text-blue-700">
                <p>
                  Signs in with mobile number{' '}
                  <span className="font-semibold">{pickedStaff?.mobileNumber ?? editing?.mobileNumber}</span>
                </p>
                <p className="text-xs text-blue-600 mt-0.5">
                  Name and number come from the staff record.
                  {editing?.staffId && !fromStaffProfile && (
                    <> <Link to={`/dashboard/staff/view/${editing.staffId}`} className="underline">Open staff profile</Link></>
                  )}
                </p>
              </div>
            </div>
          )}

          {!linkedToStaff && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>First Name <span className="text-red-500">*</span></label>
                  <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Last Name</label>
                  <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Mobile Number <span className="text-red-500">*</span></label>
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  className={inputClass}
                />
                <p className="text-xs text-gray-400 mt-1">Used to sign in.</p>
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Optional" className={inputClass} />
              </div>
            </>
          )}

          <div>
            <label className={labelClass}>Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className={inputClass}
              disabled={isSelf || roleOptions.length === 1}
            >
              {roleOptions.map((r) => (
                <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>
              ))}
            </select>
            {isSelf && <p className="text-xs text-gray-400 mt-1">You can't change your own role.</p>}
            {linkedToStaff && role !== 'TEACHER' && (
              <p className="text-xs text-amber-600 mt-1">Office roles sign in to the website, not the mobile app.</p>
            )}
          </div>

          {!editing && (
            <PasswordFields
              password={password}
              confirmPassword={confirmPassword}
              onPasswordChange={setPassword}
              onConfirmPasswordChange={setConfirmPassword}
              disabled={isSaving}
            />
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving…' : editing ? 'Save Changes' : presetStaff ? 'Enable Login' : 'Create Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginFormModal;
