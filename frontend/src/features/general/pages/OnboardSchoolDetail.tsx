import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "react-query";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaUser, FaLock, FaSpinner, FaEye, FaEyeSlash,
  FaSchool, FaEnvelope, FaPhone, FaMapMarkerAlt,
  FaArrowLeft, FaCheckCircle, FaTimes, FaBuilding,
  FaIdCard, FaUserShield, FaSignOutAlt, FaEdit, FaImage,
} from "react-icons/fa";
import { useAppContext } from "../../../providers/AppContext";
import { getSchoolById, verifyOnboardCredentials, createSuperAdmin, getSchoolSuperAdmin, updateSchool, uploadSchoolLogo, School, SuperAdminUser } from "../../../api/school";

interface CredentialsFormData {
  username: string;
  password: string;
}

interface EditSchoolFormData {
  name: string;
  email: string;
  mobile: string;
  sid: string;
  udiceCode: string;
  street: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  active: boolean;
}

interface SuperAdminFormData {
  firstName: string;
  lastName: string;
  mobileNumber: string;
  adminPassword: string;
  confirmPassword: string;
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

// ── Credentials Gate ─────────────────────────────────────────────
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
          <p className="text-white/60 text-sm">Enter your onboarding credentials to access school details and manage administrators.</p>
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

// ── Info Row ─────────────────────────────────────────────────────
const InfoRow = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) =>
  value ? (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="text-blue-500 text-xs" />
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-sm text-gray-800 mt-0.5">{value}</p>
      </div>
    </div>
  ) : null;

// ── Add Super Admin Modal ─────────────────────────────────────────
const AddSuperAdminModal = ({
  school,
  onClose,
  onSuccess,
}: {
  school: School;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const { showToast } = useAppContext();
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const token = getOnboardCookie();

  const { register, formState: { errors }, handleSubmit, watch } =
    useForm<SuperAdminFormData>();

  const createMutation = useMutation(
    (data: SuperAdminFormData) =>
      createSuperAdmin(token!, {
        firstName: data.firstName,
        lastName: data.lastName,
        mobileNumber: data.mobileNumber,
        adminPassword: data.adminPassword,
        schoolId: school.id,
      }),
    {
      onSuccess: () => {
        showToast({ message: "Super admin created successfully!", type: "SUCCESS" });
        onSuccess();
      },
      onError: (err: Error) => showToast({ message: err.message, type: "ERROR" }),
    }
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Add Super Admin</h2>
            <p className="text-xs text-gray-500 mt-0.5">Creating admin for {school.name}</p>
          </div>
          <button type="button" onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors">
            <FaTimes />
          </button>
        </div>

        <div className="px-6 py-5">
          <form className="space-y-4" onSubmit={handleSubmit((d) => createMutation.mutate(d))}>
            {/* Name */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">First Name <span className="text-red-500">*</span></label>
                <input type="text" placeholder="First name" className={inputCls(!!errors.firstName)}
                  {...register("firstName", { required: "First name is required" })} />
                {errors.firstName && <p className="text-red-500 text-xs">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">Last Name <span className="text-red-500">*</span></label>
                <input type="text" placeholder="Last name" className={inputCls(!!errors.lastName)}
                  {...register("lastName", { required: "Last name is required" })} />
                {errors.lastName && <p className="text-red-500 text-xs">{errors.lastName.message}</p>}
              </div>
            </div>

            {/* Mobile */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Mobile Number <span className="text-red-500">*</span></label>
              <input type="tel" placeholder="9876543210" className={inputCls(!!errors.mobileNumber)}
                {...register("mobileNumber", {
                  required: "Mobile number is required",
                  pattern: { value: /^\d{10}$/, message: "Enter a valid 10-digit number" },
                })} />
              {errors.mobileNumber && <p className="text-red-500 text-xs">{errors.mobileNumber.message}</p>}
            </div>

            {/* Password + Confirm */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input type={showAdminPassword ? "text" : "password"} placeholder="Min 6 chars"
                    className={inputCls(!!errors.adminPassword)}
                    {...register("adminPassword", { required: "Password is required", minLength: { value: 6, message: "Min 6 characters" } })} />
                  <button type="button" onClick={() => setShowAdminPassword(v => !v)}
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                    {showAdminPassword ? <FaEyeSlash className="text-xs" /> : <FaEye className="text-xs" />}
                  </button>
                </div>
                {errors.adminPassword && <p className="text-red-500 text-xs">{errors.adminPassword.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">Confirm <span className="text-red-500">*</span></label>
                <input type="password" placeholder="Re-enter"
                  className={inputCls(!!errors.confirmPassword)}
                  {...register("confirmPassword", {
                    required: "Please confirm",
                    validate: (v) => v === watch("adminPassword") || "Passwords do not match",
                  })} />
                {errors.confirmPassword && <p className="text-red-500 text-xs">{errors.confirmPassword.message}</p>}
              </div>
            </div>

            <button type="submit" disabled={createMutation.isLoading}
              className={`w-full py-2.5 px-4 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors ${createMutation.isLoading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}>
              {createMutation.isLoading
                ? <><FaSpinner className="animate-spin" />Creating…</>
                : <><FaCheckCircle />Create Super Admin</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// ── Super Admin Card ─────────────────────────────────────────────
const SuperAdminCard = ({ admin }: { admin: SuperAdminUser }) => (
  <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center gap-4">
    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
      <FaUserShield className="text-green-600 text-sm" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-gray-900">{admin.firstName} {admin.lastName}</p>
      <p className="text-xs text-gray-500 mt-0.5">{admin.mobileNumber}</p>
    </div>
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700 flex-shrink-0">
      Super Admin
    </span>
  </div>
);

// ── Edit School Modal ─────────────────────────────────────────────
const EditSchoolModal = ({
  school,
  onClose,
  onSuccess,
}: {
  school: School;
  onClose: () => void;
  onSuccess: (updated: School) => void;
}) => {
  const { showToast } = useAppContext();
  const token = getOnboardCookie();

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(school.logoUrl ?? null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [uploadedLogoUrl, setUploadedLogoUrl] = useState<string | null>(school.logoUrl ?? null);

  const { register, formState: { errors }, handleSubmit } = useForm<EditSchoolFormData>({
    defaultValues: {
      name: school.name,
      email: school.email,
      mobile: school.mobile,
      sid: school.sid,
      udiceCode: school.udiceCode,
      street: school.street,
      city: school.city,
      district: school.district,
      state: school.state,
      pincode: school.pincode,
      active: school.active,
    },
  });

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setLogoUploading(true);
    try {
      const result = await uploadSchoolLogo(token!, file, school.id);
      setUploadedLogoUrl(result.logoUrl);
    } catch (err: any) {
      showToast({ message: err.message || 'Failed to upload logo', type: 'ERROR' });
      setLogoFile(null);
      setLogoPreview(school.logoUrl ?? null);
    } finally {
      setLogoUploading(false);
    }
  };

  const updateMutation = useMutation(
    (data: EditSchoolFormData) =>
      updateSchool(school.id, {
        ...data,
        logoUrl: uploadedLogoUrl ?? undefined,
      }),
    {
      onSuccess: (updated) => {
        showToast({ message: 'School updated successfully!', type: 'SUCCESS' });
        onSuccess(updated);
      },
      onError: (err: Error) => showToast({ message: err.message, type: 'ERROR' }),
    }
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Edit School</h2>
            <p className="text-xs text-gray-500 mt-0.5">{school.name}</p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <FaTimes />
          </button>
        </div>

        <div className="px-6 py-5">
          <form className="space-y-5" onSubmit={handleSubmit((d) => updateMutation.mutate(d))}>
            {/* School Info */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <FaSchool className="text-blue-500" /> School Info
              </p>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">School Name <span className="text-red-500">*</span></label>
                <input type="text" className={inputCls(!!errors.name)}
                  {...register("name", { required: "School name is required" })} />
                {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-600">SID <span className="text-red-500">*</span></label>
                  <input type="text" className={inputCls(!!errors.sid)}
                    {...register("sid", { required: "SID is required", minLength: { value: 3, message: "Min 3 chars" } })} />
                  {errors.sid && <p className="text-red-500 text-xs">{errors.sid.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-600">UDICE Code <span className="text-red-500">*</span></label>
                  <input type="text" className={inputCls(!!errors.udiceCode)}
                    {...register("udiceCode", { required: "UDICE code is required" })} />
                  {errors.udiceCode && <p className="text-red-500 text-xs">{errors.udiceCode.message}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-gray-600">Active</label>
                <input type="checkbox" className="w-4 h-4 accent-blue-600" {...register("active")} />
              </div>
            </div>

            {/* Logo */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <FaImage className="text-blue-500" /> Logo
              </p>
              <label className="flex items-center gap-4 cursor-pointer">
                <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 bg-gray-50">
                  {logoPreview
                    ? <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                    : logoUploading
                      ? <FaSpinner className="animate-spin text-gray-400" />
                      : <FaImage className="text-gray-300 text-xl" />}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-600">
                    {logoUploading ? 'Uploading…' : logoFile ? logoFile.name : 'Click to change logo'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">PNG, JPG, WebP, SVG · Max 5MB</p>
                  {uploadedLogoUrl && uploadedLogoUrl !== school.logoUrl && (
                    <p className="text-xs text-green-600 mt-0.5 flex items-center gap-1"><FaCheckCircle /> Uploaded</p>
                  )}
                </div>
                <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml" className="hidden"
                  onChange={handleLogoChange} disabled={logoUploading} />
              </label>
            </div>

            {/* Contact */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <FaEnvelope className="text-blue-500" /> Contact
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-600">Email <span className="text-red-500">*</span></label>
                  <input type="email" className={inputCls(!!errors.email)}
                    {...register("email", { required: "Email is required" })} />
                  {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-600">Mobile <span className="text-red-500">*</span></label>
                  <input type="tel" className={inputCls(!!errors.mobile)}
                    {...register("mobile", { required: "Mobile is required" })} />
                  {errors.mobile && <p className="text-red-500 text-xs">{errors.mobile.message}</p>}
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
                <input type="text" className={inputCls(!!errors.street)}
                  {...register("street", { required: "Street is required" })} />
                {errors.street && <p className="text-red-500 text-xs">{errors.street.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(["city", "district", "state", "pincode"] as const).map((field) => (
                  <div key={field} className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-600 capitalize">{field} <span className="text-red-500">*</span></label>
                    <input type="text" className={inputCls(!!errors[field])}
                      {...register(field, { required: `${field} is required` })} />
                    {errors[field] && <p className="text-red-500 text-xs">{errors[field]?.message}</p>}
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" disabled={updateMutation.isLoading || logoUploading}
              className={`w-full py-2.5 px-4 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors ${updateMutation.isLoading || logoUploading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}>
              {updateMutation.isLoading
                ? <><FaSpinner className="animate-spin" />Saving…</>
                : <><FaCheckCircle />Save Changes</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// ── Main Detail Page ──────────────────────────────────────────────
const OnboardSchoolDetail = () => {
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [verified, setVerified] = useState(() => !!getOnboardCookie());

  const { data: school, isLoading, isError, refetch: refetchSchool } = useQuery<School>(
    ["school", schoolId],
    () => getSchoolById(Number(schoolId)),
    { enabled: !!schoolId && verified, retry: 1 }
  );

  const { data: superAdmin, isLoading: isAdminLoading, refetch: refetchAdmin } = useQuery<SuperAdminUser | null>(
    ["schoolSuperAdmin", schoolId],
    () => getSchoolSuperAdmin(Number(schoolId)),
    { enabled: !!schoolId && verified, retry: 1 }
  );

  if (!verified) {
    return <CredentialsGate onVerified={() => setVerified(true)} />;
  }

  const hasSuperAdmin = !!superAdmin;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/onboard")}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
            >
              <FaArrowLeft className="text-sm" />
            </button>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 ${school?.logoUrl ? '' : 'bg-blue-100'}`}>
                {school?.logoUrl
                  ? <img src={school.logoUrl} alt={school.name} className="w-full h-full object-contain" />
                  : <FaSchool className="text-blue-600 text-sm" />}
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900 leading-tight">
                  {isLoading ? "Loading…" : school?.name ?? "School Detail"}
                </h1>
                <p className="text-xs text-gray-500">School Onboarding Portal</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {school && (
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition-colors"
              >
                <FaEdit className="text-xs" />
                Edit
              </button>
            )}
            {school && !hasSuperAdmin && (
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
              >
                <FaUserShield className="text-xs" />
                Add Super Admin
              </button>
            )}
            <button
              onClick={() => { clearOnboardCookie(); navigate("/onboard"); }}
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
      <div className="max-w-4xl mx-auto px-6 py-10">
        {isLoading && (
          <div className="flex items-center justify-center py-24 text-gray-400">
            <FaSpinner className="animate-spin text-2xl" />
          </div>
        )}

        {isError && (
          <div className="text-center py-24 text-gray-500">
            <p className="text-sm">Failed to load school.</p>
            <button onClick={() => navigate("/onboard")} className="mt-2 text-blue-600 text-sm hover:underline">
              Back to list
            </button>
          </div>
        )}

        {school && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* School identity */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center text-center">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 overflow-hidden ${school.logoUrl ? '' : 'bg-blue-100'}`}>
                  {school.logoUrl
                    ? <img src={school.logoUrl} alt={school.name} className="w-full h-full object-contain" />
                    : <FaSchool className="text-blue-600 text-2xl" />}
                </div>
                <h2 className="font-bold text-gray-900 text-lg leading-tight">{school.name}</h2>
                <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                  <FaIdCard className="text-xs" />
                  {school.sid}
                </span>
                <span className={`mt-2 inline-flex px-3 py-1 rounded-full text-xs font-semibold ${school.active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-500"}`}>
                  {school.active ? "Active" : "Inactive"}
                </span>

                {!isAdminLoading && !hasSuperAdmin && (
                  <button
                    onClick={() => setShowModal(true)}
                    className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
                  >
                    <FaUserShield className="text-xs" />
                    Add Super Admin
                  </button>
                )}
              </div>
            </div>

            {/* School details */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-sm font-bold text-gray-700 mb-2">School Information</h3>
                <div className="divide-y divide-gray-50">
                  <InfoRow icon={FaEnvelope} label="Email" value={school.email} />
                  <InfoRow icon={FaPhone} label="Mobile" value={school.mobile} />
                  <InfoRow icon={FaBuilding} label="UDICE Code" value={school.udiceCode} />
                  <InfoRow
                    icon={FaMapMarkerAlt}
                    label="Address"
                    value={[school.street, school.city, school.district, school.state, school.pincode].filter(Boolean).join(", ")}
                  />
                  <InfoRow icon={FaIdCard} label="School ID" value={school.sid} />
                </div>

              </div>

              {/* Super Admin section */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-sm font-bold text-gray-700 mb-3">Super Admin</h3>
                {isAdminLoading ? (
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <FaSpinner className="animate-spin text-xs" /> Loading…
                  </div>
                ) : hasSuperAdmin ? (
                  <SuperAdminCard admin={superAdmin!} />
                ) : (
                  <div className="flex items-center justify-between py-2">
                    <p className="text-sm text-gray-400">No super admin assigned yet.</p>
                    <button
                      onClick={() => setShowModal(true)}
                      className="text-xs font-semibold text-blue-600 hover:underline"
                    >
                      + Add
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-gray-400 py-8">
        © {new Date().getFullYear()} Al-Sufiaan School. All rights reserved.
      </p>

      {showModal && school && (
        <AddSuperAdminModal
          school={school}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); refetchAdmin(); }}
        />
      )}

      {showEditModal && school && (
        <EditSchoolModal
          school={school}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => { setShowEditModal(false); refetchSchool(); }}
        />
      )}
    </div>
  );
};

export default OnboardSchoolDetail;
