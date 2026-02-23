import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "react-query";
import * as apiClient from "../api";
import { useAppContext } from "../../../providers/AppContext";
import { useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock, FaSpinner, FaEye, FaEyeSlash, FaGraduationCap, FaUserCheck, FaChartBar } from "react-icons/fa";
import { SignInFormData } from "../types";

const FEATURES = [
  { icon: FaUserCheck, label: "Staff & Payroll Management" },
  { icon: FaGraduationCap, label: "Student Enrollment Tracking" },
  { icon: FaChartBar, label: "Attendance & Fee Reports" },
];

const SignIn = () => {
  const { showToast } = useAppContext();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm<SignInFormData>();

  const queryClient = useQueryClient();
  const mutation = useMutation(apiClient.signIn, {
    onSuccess: async () => {
      await queryClient.invalidateQueries("validateToken");
      showToast({ message: "Sign in Successful!", type: "SUCCESS" });
      navigate("/dashboard/expense");
    },
    onError: (error: Error) => {
      showToast({ message: error.message, type: "ERROR" });
    },
  });

  const onSubmit = handleSubmit((data) => {
    mutation.mutate(data);
  });

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 px-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-white/5 rounded-full" />
        <div className="absolute -bottom-32 -right-20 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute top-1/3 right-8 w-24 h-24 bg-white/5 rounded-full" />

        <div className="relative z-10 flex flex-col items-center text-center space-y-8 max-w-md">
          {/* Logo */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 shadow-xl">
            <img
              src="/img/school-logo.png"
              alt="Al-Sufiaan School"
              className="w-20 h-20 object-contain"
            />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-white leading-tight">
              Al-Sufiaan School
            </h1>
            <p className="mt-2 text-blue-100 text-sm">
              School Management System
            </p>
          </div>

          <div className="w-full space-y-3">
            {FEATURES.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3 text-left"
              >
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="text-white text-sm" />
                </div>
                <span className="text-white/90 text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-col items-center justify-center w-full lg:w-1/2 px-6 py-12">
        {/* Mobile logo */}
        <div className="flex lg:hidden flex-col items-center mb-8 gap-3">
          <img
            src="/img/school-logo.png"
            alt="Al-Sufiaan School"
            className="w-14 h-14 object-contain"
          />
          <span className="text-lg font-bold text-gray-800">Al-Sufiaan School</span>
        </div>

        <div className="w-full max-w-sm">
          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
            <p className="mt-1 text-sm text-gray-500">
              Sign in to access the school dashboard
            </p>
          </div>

          <form className="space-y-5" onSubmit={onSubmit}>
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <FaEnvelope className="absolute top-1/2 left-3.5 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="email"
                  placeholder="you@school.com"
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm bg-white
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    transition-colors
                    ${errors.email
                      ? "border-red-300 bg-red-50 focus:ring-red-400"
                      : "border-gray-200"
                    }`}
                  {...register("email", { required: "Email is required" })}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <FaLock className="absolute top-1/2 left-3.5 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-2.5 border rounded-lg text-sm bg-white
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    transition-colors
                    ${errors.password
                      ? "border-red-300 bg-red-50 focus:ring-red-400"
                      : "border-gray-200"
                    }`}
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={mutation.isLoading}
              className={`w-full py-2.5 px-4 text-white text-sm font-semibold rounded-lg
                shadow-sm flex items-center justify-center gap-2 transition-colors mt-2
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${mutation.isLoading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
                }`}
            >
              {mutation.isLoading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign In"
              )}
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

export default SignIn;
