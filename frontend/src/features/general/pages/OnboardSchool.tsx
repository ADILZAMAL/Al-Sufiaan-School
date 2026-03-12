import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "react-query";
import { useNavigate } from "react-router-dom";
import {
  FaUser, FaLock, FaSpinner, FaEye, FaEyeSlash,
  FaSchool, FaEnvelope, FaPhone, FaMapMarkerAlt,
  FaArrowLeft, FaCheckCircle, FaPlus, FaTimes, FaSignOutAlt,
  FaIdCard, FaBuilding,
} from "react-icons/fa";
import { useAppContext } from "../../../providers/AppContext";
import {
  getAllSchools,
  verifyOnboardCredentials,
  onboardSchool,
  OnboardSchoolData,
  School,
} from "../../../api/school";

interface CredentialsFormData {
  username: string;
  password: string;
}

interface SchoolFormData {
  name: string;
  sid: string;
  udiceCode: string;
  email: string;
  mobile: string;
  street: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
}

const getOnboardCookie = (): string | null => {
  const match = document.cookie.match(/(?:^|; )onboard_creds=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
};

const setOnboardCookie = (value: string) => {
  document.cookie = `onboard_creds=${encodeURIComponent(value)}; path=/`;
};

const clearOnboardCookie = () => {
  document.cookie = 'onboard_creds=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
};

const inputCls = (hasError?: boolean) =>
  `w-full px-3 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
    hasError ? "border-red-300 bg-red-50 focus:ring-red-400" : "border-gray-200"
  }`;

// ── School Info Card ────────────────────────────────────────────
const SchoolCard = ({ school }: { school: School }) => {
  const navigate = useNavigate();
  return (
  <div
    onClick={() => navigate(`/onboard/${school.id}`)}
    className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer p-6"
  >
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <FaSchool className="text-blue-600 text-sm" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 text-sm leading-tight">{school.name}</h3>
          <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
            <FaIdCard className="text-xs" />
            {school.sid}
          </span>
        </div>
      </div>
      <span
        className={`text-xs font-medium px-2 py-1 rounded-full ${
          school.active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
        }`}
      >
        {school.active ? "Active" : "Inactive"}
      </span>
    </div>

    <div className="space-y-2 text-xs text-gray-600">
      <div className="flex items-center gap-2">
        <FaEnvelope className="text-gray-400 flex-shrink-0" />
        <span className="truncate">{school.email}</span>
      </div>
      <div className="flex items-center gap-2">
        <FaPhone className="text-gray-400 flex-shrink-0" />
        <span>{school.mobile}</span>
      </div>
      <div className="flex items-start gap-2">
        <FaMapMarkerAlt className="text-gray-400 flex-shrink-0 mt-0.5" />
        <span>{[school.street, school.city, school.district, school.state, school.pincode].filter(Boolean).join(", ")}</span>
      </div>
      <div className="flex items-center gap-2">
        <FaBuilding className="text-gray-400 flex-shrink-0" />
        <span>UDICE: {school.udiceCode}</span>
      </div>
    </div>
    <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-end">
      <span className="text-xs text-blue-600 font-medium">View details →</span>
    </div>
  </div>
  );
};

// ── Two-step Onboard Modal ──────────────────────────────────────
const OnboardModal = ({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const { showToast } = useAppContext();
  const [step, setStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const { register: reg1, formState: { errors: err1 }, handleSubmit: submit1 } =
    useForm<CredentialsFormData>();
  const { register: reg2, formState: { errors: err2 }, handleSubmit: submit2 } =
    useForm<SchoolFormData>();

  const verifyMutation = useMutation(
    (data: CredentialsFormData) => verifyOnboardCredentials(data.username, data.password),
    {
      onSuccess: (tok) => { setToken(tok); setStep(2); },
      onError: (err: Error) => showToast({ message: err.message, type: "ERROR" }),
    }
  );

  const onboardMutation = useMutation(
    (schoolData: SchoolFormData) => onboardSchool(token!, schoolData),
    {
      onSuccess: () => {
        showToast({ message: "School onboarded successfully!", type: "SUCCESS" });
        onSuccess();
      },
      onError: (err: Error) => showToast({ message: err.message, type: "ERROR" }),
    }
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {step === 2 && (
              <button
                type="button"
                onClick={() => { setStep(1); setToken(null); }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaArrowLeft className="text-sm" />
              </button>
            )}
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {step === 1 ? "Admin Verification" : "School Details"}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {step === 1
                  ? "Enter onboarding credentials to proceed"
                  : "Fill in the school information"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Step dots */}
            <div className="flex gap-1.5">
              {[1, 2].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all ${
                    step === s ? "w-5 bg-blue-600" : step > s ? "w-3 bg-green-500" : "w-3 bg-gray-200"
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors ml-1"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        <div className="px-6 py-5">
          {/* ── Step 1 ── */}
          {step === 1 && (
            <form className="space-y-4" onSubmit={submit1((d) => verifyMutation.mutate(d))}>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Username</label>
                <div className="relative">
                  <FaUser className="absolute top-1/2 left-3.5 -translate-y-1/2 text-gray-400 text-xs" />
                  <input
                    type="text"
                    placeholder="Enter admin username"
                    className={`w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${err1.username ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                    {...reg1("username", { required: "Username is required" })}
                  />
                </div>
                {err1.username && <p className="text-red-500 text-xs">{err1.username.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <FaLock className="absolute top-1/2 left-3.5 -translate-y-1/2 text-gray-400 text-xs" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className={`w-full pl-9 pr-10 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${err1.password ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                    {...reg1("password", { required: "Password is required" })}
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                    {showPassword ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
                  </button>
                </div>
                {err1.password && <p className="text-red-500 text-xs">{err1.password.message}</p>}
              </div>

              <button type="submit" disabled={verifyMutation.isLoading}
                className={`w-full py-2.5 px-4 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors mt-2 ${verifyMutation.isLoading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}>
                {verifyMutation.isLoading ? <><FaSpinner className="animate-spin" />Verifying…</> : "Verify & Continue"}
              </button>
            </form>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <form className="space-y-5" onSubmit={submit2((d) => onboardMutation.mutate(d))}>
              {/* School Info */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FaSchool className="text-blue-500" /> School Info
                </p>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-600">School Name <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="e.g. Al-Sufiaan School" className={inputCls(!!err2.name)}
                    {...reg2("name", { required: "School name is required" })} />
                  {err2.name && <p className="text-red-500 text-xs">{err2.name.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-600">School ID (SID) <span className="text-red-500">*</span></label>
                    <input type="text" placeholder="e.g. ALS" className={inputCls(!!err2.sid)}
                      {...reg2("sid", { required: "SID is required", minLength: { value: 3, message: "Min 3 characters" } })} />
                    {err2.sid && <p className="text-red-500 text-xs">{err2.sid.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-600">UDICE Code <span className="text-red-500">*</span></label>
                    <input type="text" placeholder="e.g. 09140105116" className={inputCls(!!err2.udiceCode)}
                      {...reg2("udiceCode", { required: "UDICE code is required" })} />
                    {err2.udiceCode && <p className="text-red-500 text-xs">{err2.udiceCode.message}</p>}
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FaEnvelope className="text-blue-500" /> Contact
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-600">Email <span className="text-red-500">*</span></label>
                    <input type="email" placeholder="school@example.com" className={inputCls(!!err2.email)}
                      {...reg2("email", { required: "Email is required", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email" } })} />
                    {err2.email && <p className="text-red-500 text-xs">{err2.email.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-600">Mobile <span className="text-red-500">*</span></label>
                    <input type="tel" placeholder="9876543210" className={inputCls(!!err2.mobile)}
                      {...reg2("mobile", { required: "Mobile is required" })} />
                    {err2.mobile && <p className="text-red-500 text-xs">{err2.mobile.message}</p>}
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FaMapMarkerAlt className="text-blue-500" /> Address
                </p>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-600">Street <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="Street address" className={inputCls(!!err2.street)}
                    {...reg2("street", { required: "Street is required" })} />
                  {err2.street && <p className="text-red-500 text-xs">{err2.street.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      { name: "city", label: "City", placeholder: "City" },
                      { name: "district", label: "District", placeholder: "District" },
                      { name: "state", label: "State", placeholder: "State" },
                      { name: "pincode", label: "Pincode", placeholder: "e.g. 110001" },
                    ] as const
                  ).map(({ name, label, placeholder }) => (
                    <div key={name} className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-600">{label} <span className="text-red-500">*</span></label>
                      <input type="text" placeholder={placeholder} className={inputCls(!!err2[name])}
                        {...reg2(name, { required: `${label} is required` })} />
                      {err2[name] && <p className="text-red-500 text-xs">{err2[name]?.message}</p>}
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={onboardMutation.isLoading}
                className={`w-full py-2.5 px-4 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors ${onboardMutation.isLoading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}>
                {onboardMutation.isLoading
                  ? <><FaSpinner className="animate-spin" />Onboarding…</>
                  : <><FaCheckCircle />Onboard School</>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Credentials Gate ────────────────────────────────────────────
const CredentialsGate = ({ onVerified }: { onVerified: () => void }) => {
  const { showToast } = useAppContext();
  const [showPassword, setShowPassword] = useState(false);
  const { register, formState: { errors }, handleSubmit } = useForm<CredentialsFormData>();

  const mutation = useMutation(
    (data: CredentialsFormData) => verifyOnboardCredentials(data.username, data.password),
    {
      onSuccess: (tok) => {
        setOnboardCookie(tok);
        onVerified();
      },
      onError: (err: Error) => showToast({ message: err.message, type: "ERROR" }),
    }
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 px-12 relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-white/5 rounded-full" />
        <div className="absolute -bottom-32 -right-20 w-96 h-96 bg-white/5 rounded-full" />
        <div className="relative z-10 flex flex-col items-center text-center space-y-6 max-w-md">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 shadow-xl">
            <img src="/img/school-logo.png" alt="Al-Sufiaan School" className="w-20 h-20 object-contain" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Al-Sufiaan School</h1>
            <p className="mt-2 text-blue-100 text-sm">School Onboarding Portal</p>
          </div>
          <p className="text-white/60 text-sm">Enter your onboarding credentials to access the portal and manage schools.</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-col items-center justify-center w-full lg:w-1/2 px-6 py-12">
        <div className="flex lg:hidden flex-col items-center mb-8 gap-3">
          <img src="/img/school-logo.png" alt="Al-Sufiaan School" className="w-14 h-14 object-contain" />
          <span className="text-lg font-bold text-gray-800">Al-Sufiaan School</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Onboarding Portal</h2>
            <p className="mt-1 text-sm text-gray-500">Enter your credentials to continue</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit((d) => mutation.mutate(d))}>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Username</label>
              <div className="relative">
                <FaUser className="absolute top-1/2 left-3.5 -translate-y-1/2 text-gray-400 text-sm" />
                <input type="text" placeholder="Enter username"
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.username ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                  {...register("username", { required: "Username is required" })} />
              </div>
              {errors.username && <p className="text-red-500 text-xs">{errors.username.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Password</label>
              <div className="relative">
                <FaLock className="absolute top-1/2 left-3.5 -translate-y-1/2 text-gray-400 text-sm" />
                <input type={showPassword ? "text" : "password"} placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.password ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                  {...register("password", { required: "Password is required" })} />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" tabIndex={-1}>
                  {showPassword ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={mutation.isLoading}
              className={`w-full py-2.5 px-4 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${mutation.isLoading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}>
              {mutation.isLoading ? <><FaSpinner className="animate-spin" />Verifying…</> : "Enter Portal"}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-gray-400">
            © {new Date().getFullYear()} Al-Sufiaan School. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

// ── Main Page ───────────────────────────────────────────────────
const OnboardSchool = () => {
  const [isVerified, setIsVerified] = useState(() => !!getOnboardCookie());
  const [showModal, setShowModal] = useState(false);

  const { data: schools, isLoading, isError, refetch } = useQuery<School[]>(
    "allSchools",
    getAllSchools,
    { retry: 1, enabled: isVerified }
  );

  if (!isVerified) {
    return <CredentialsGate onVerified={() => setIsVerified(true)} />;
  }

  const handleSuccess = () => {
    setShowModal(false);
    refetch();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/img/school-logo.png" alt="Al-Sufiaan School" className="w-9 h-9 object-contain" />
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">Al-Sufiaan School</h1>
              <p className="text-xs text-gray-500">School Onboarding Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
            >
              <FaPlus className="text-xs" />
              Onboard New School
            </button>
            <button
              onClick={() => { clearOnboardCookie(); setIsVerified(false); }}
              className="flex items-center gap-2 px-3 py-2 text-gray-500 hover:text-red-600 hover:bg-red-50 text-sm font-medium rounded-lg transition-colors"
              title="Logout"
            >
              <FaSignOutAlt className="text-sm" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Stats bar */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Registered Schools</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {isLoading
                ? "Loading…"
                : `${schools?.length ?? 0} school${(schools?.length ?? 0) !== 1 ? "s" : ""} registered`}
            </p>
          </div>
          {(schools?.length ?? 0) > 0 && (
            <div className="flex gap-4 text-sm">
              <div className="text-center">
                <p className="font-bold text-green-600">{schools?.filter(s => s.active).length ?? 0}</p>
                <p className="text-gray-500 text-xs">Active</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-red-500">{schools?.filter(s => !s.active).length ?? 0}</p>
                <p className="text-gray-500 text-xs">Inactive</p>
              </div>
            </div>
          )}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-24 text-gray-400">
            <FaSpinner className="animate-spin text-2xl" />
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="text-center py-24 text-gray-500">
            <p className="text-sm">Failed to load schools.</p>
            <button onClick={() => refetch()} className="mt-2 text-blue-600 text-sm hover:underline">Retry</button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && (!schools || schools.length === 0) && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
              <FaSchool className="text-blue-400 text-2xl" />
            </div>
            <h3 className="text-base font-semibold text-gray-700">No schools registered yet</h3>
            <p className="text-sm text-gray-400 mt-1 mb-5">Get started by onboarding your first school.</p>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <FaPlus className="text-xs" />
              Onboard New School
            </button>
          </div>
        )}

        {/* School cards grid */}
        {!isLoading && schools && schools.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {schools.map((school) => (
              <SchoolCard key={school.id} school={school} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-gray-400 py-8">
        © {new Date().getFullYear()} Al-Sufiaan School. All rights reserved.
      </p>

      {/* Onboard School Modal */}
      {showModal && (
        <OnboardModal
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

export default OnboardSchool;
