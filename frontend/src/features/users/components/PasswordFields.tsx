import React, { useState } from 'react';
import { HiEye, HiEyeOff, HiCheckCircle, HiXCircle } from 'react-icons/hi';
import { PASSWORD_RULES } from '../../auth/utils/passwordRules';

interface PasswordFieldsProps {
  password: string;
  confirmPassword: string;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
}

const inputClass = 'w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';

const PasswordInput: React.FC<{ value: string; onChange: (v: string) => void; placeholder: string; disabled?: boolean }> = ({
  value, onChange, placeholder, disabled,
}) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputClass}
        disabled={disabled}
        autoComplete="new-password"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        tabIndex={-1}
      >
        {show ? <HiEyeOff className="w-4 h-4" /> : <HiEye className="w-4 h-4" />}
      </button>
    </div>
  );
};

/** New password + confirmation with the live policy checklist. */
const PasswordFields: React.FC<PasswordFieldsProps> = ({
  password, confirmPassword, onPasswordChange, onConfirmPasswordChange, label = 'Password', disabled,
}) => (
  <>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <PasswordInput value={password} onChange={onPasswordChange} placeholder="Create a strong password" disabled={disabled} />
    </div>

    {password && (
      <div className="bg-gray-50 rounded-lg px-4 py-3 space-y-1.5">
        {PASSWORD_RULES.map((rule) => {
          const passed = rule.test(password);
          return (
            <div key={rule.label} className="flex items-center gap-2">
              {passed
                ? <HiCheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                : <HiXCircle className="w-3.5 h-3.5 text-gray-300 shrink-0" />}
              <span className={`text-xs ${passed ? 'text-green-700' : 'text-gray-400'}`}>{rule.label}</span>
            </div>
          );
        })}
      </div>
    )}

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
      <PasswordInput value={confirmPassword} onChange={onConfirmPasswordChange} placeholder="Re-enter password" disabled={disabled} />
    </div>
  </>
);

export default PasswordFields;
