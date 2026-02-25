import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { HiArrowLeft, HiPencil, HiTrash, HiCurrencyRupee, HiPlus, HiLockClosed, HiLockOpen } from 'react-icons/hi';
import { staffApi } from '../api/staff';
import { Staff } from '../types';
import { payslipApi } from '../../payslips/api/payslips';
import { Payslip } from '../../payslips/types';
import PayslipGenerator from '../../payslips/components/PayslipGenerator';
import PayslipList from '../../payslips/components/PayslipList';
import PayslipView from '../../payslips/components/PayslipView';
import EnableLoginModal from '../components/EnableLoginModal';
import Toast from '../../../components/common/Toast';

const ViewStaffDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [staff, setStaff] = useState<Staff | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'SUCCESS' | 'ERROR' } | null>(null);

  // Payslip related state
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [isLoadingPayslips, setIsLoadingPayslips] = useState(false);
  const [showPayslipGenerator, setShowPayslipGenerator] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);

  // Login access state
  const [showEnableLoginModal, setShowEnableLoginModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);

  useEffect(() => {
    fetchStaffDetails();
  }, [id]);

  useEffect(() => {
    if (staff?.id) {
      fetchPayslips();
    }
  }, [staff]);

  const fetchPayslips = async () => {
    if (!staff?.id || !staff.staffType) return;

    setIsLoadingPayslips(true);
    try {
      const response = await payslipApi.getByStaff(staff.id, 1, 5);
      setPayslips(response.payslips);
    } catch (error: any) {
      console.error('Error fetching payslips:', error);
    } finally {
      setIsLoadingPayslips(false);
    }
  };

  const handlePayslipGenerated = (newPayslip: Payslip) => {
    setPayslips(prev => [newPayslip, ...prev]);
    setShowPayslipGenerator(false);
  };

  const handleViewPayslip = (payslip: Payslip) => {
    setSelectedPayslip(payslip);
  };

  const fetchStaffDetails = async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      const staffData = await staffApi.getById(parseInt(id));
      setStaff(staffData);
    } catch (error: any) {
      setToast({
        message: error.message || 'Failed to fetch staff details',
        type: 'ERROR'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableLogin = async () => {
    if (!staff?.id) return;
    if (!window.confirm('Are you sure you want to disable login for this staff member? They will no longer be able to access the mobile app.')) return;

    try {
      await staffApi.disableLogin(staff.id);
      setToast({ message: 'Login disabled successfully', type: 'SUCCESS' });
      fetchStaffDetails();
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to disable login', type: 'ERROR' });
    }
  };

  const handleLeftSchool = async () => {
    if (!staff?.id) return;

    if (!window.confirm('Are you sure you want to mark this staff member as left school?')) {
      return;
    }

    try {
      await staffApi.markLeftSchool(staff.id);
      setToast({ message: 'Staff member marked as left school successfully!', type: 'SUCCESS' });
      setTimeout(() => navigate('/dashboard/staff'), 2000);
    } catch (error: any) {
      setToast({
        message: error.message || 'Failed to mark staff member as left school',
        type: 'ERROR'
      });
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading staff details...</p>
        </div>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Staff member not found</p>
          <Link to="/dashboard/staff" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
            Back to Staff Management
          </Link>
        </div>
      </div>
    );
  }

  const isTeaching = staff.staffType === 'teaching';

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {isTeaching ? 'Teaching' : 'Non-Teaching'} Staff Details
        </h1>
        <p className="text-gray-600">View details for {staff.name}</p>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header Actions */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/dashboard/staff"
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <HiArrowLeft className="h-4 w-4 mr-2" />
          Back to Staff List
        </Link>

        <div className="flex space-x-3">
          <Link
            to={`/dashboard/staff/edit/${staff.id}`}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
          >
            <HiPencil className="h-4 w-4 mr-2" />
            Edit Staff
          </Link>
          <button
            onClick={handleLeftSchool}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700"
          >
            <HiTrash className="h-4 w-4 mr-2" />
            Left School
          </button>
        </div>
      </div>

      {/* Staff Details */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          <div className="space-y-8">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h3>
              <div className="flex items-start space-x-6">
                {/* Photo */}
                {staff.photoUrl && (
                  <div className="flex-shrink-0">
                    <img
                      src={staff.photoUrl.startsWith('http') ? staff.photoUrl : `${import.meta.env.VITE_BACKEND_API_BASE_URL}/${staff.photoUrl}`}
                      alt={staff.name}
                      className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                    />
                  </div>
                )}

                {/* Personal Details */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Name</label>
                    <p className="mt-1 text-sm text-gray-900">{staff.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Gender</label>
                    <p className="mt-1 text-sm text-gray-900">{staff.gender}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Date of Birth</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(staff.dateOfBirth)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Social Category</label>
                    <p className="mt-1 text-sm text-gray-900">{staff.socialCategory || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Mobile Number</label>
                    <p className="mt-1 text-sm text-gray-900">{staff.mobileNumber}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{staff.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Aadhaar Number</label>
                    <p className="mt-1 text-sm text-gray-900">{staff.aadhaarNumber}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Name as per Aadhaar</label>
                    <p className="mt-1 text-sm text-gray-900">{staff.nameAsPerAadhaar}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Academic Qualifications */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Academic Qualifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Highest Academic Qualification</label>
                  <p className="mt-1 text-sm text-gray-900">{staff.highestAcademicQualification || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Trade/Degree</label>
                  <p className="mt-1 text-sm text-gray-900">{staff.tradeDegree || 'Not specified'}</p>
                </div>
              </div>
            </div>

            {/* Role Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Role Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Role</label>
                  <p className="mt-1 text-sm text-gray-900">{staff.role || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Staff Type</label>
                  <p className="mt-1 text-sm text-gray-900">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      isTeaching ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {isTeaching ? 'Teaching' : 'Non-Teaching'}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Subject Competencies (Teaching Staff Only) */}
            {isTeaching && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Subject Competencies</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Mathematics</label>
                    <p className="mt-1 text-sm text-gray-900">{staff.mathematicsLevel || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Science</label>
                    <p className="mt-1 text-sm text-gray-900">{staff.scienceLevel || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">English</label>
                    <p className="mt-1 text-sm text-gray-900">{staff.englishLevel || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Social Science</label>
                    <p className="mt-1 text-sm text-gray-900">{staff.socialScienceLevel || 'Not specified'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-500">Language (Schedule VIII)</label>
                    <p className="mt-1 text-sm text-gray-900">{staff.scheduleVIIILanguageLevel || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Employment Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Employment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Type of Disability</label>
                  <p className="mt-1 text-sm text-gray-900">{staff.typeOfDisability || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Nature of Appointment</label>
                  <p className="mt-1 text-sm text-gray-900">{staff.natureOfAppointment || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Date of Joining Service</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(staff.dateOfJoiningService!)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Date of Joining Present School</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(staff.dateOfJoiningPresentSchool!)}</p>
                </div>
              </div>
            </div>

            {/* Financial Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Financial Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Salary per Month</label>
                  <p className="mt-1 text-sm text-gray-900">₹{staff.salaryPerMonth || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">UPI Number</label>
                  <p className="mt-1 text-sm text-gray-900">{staff.upiNumber || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Account Number</label>
                  <p className="mt-1 text-sm text-gray-900">{staff.accountNumber || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Account Name</label>
                  <p className="mt-1 text-sm text-gray-900">{staff.accountName || 'Not specified'}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500">IFSC Code</label>
                  <p className="mt-1 text-sm text-gray-900">{staff.ifscCode || 'Not specified'}</p>
                </div>
              </div>
            </div>

            {/* Login Access */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  {staff.loginStatus?.enabled
                    ? <HiLockOpen className="h-5 w-5 mr-2 text-green-600" />
                    : <HiLockClosed className="h-5 w-5 mr-2 text-gray-400" />
                  }
                  Mobile App Login
                </h3>
                <div className="flex items-center gap-2">
                  {staff.loginStatus?.enabled ? (
                    <>
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                        Login Enabled
                      </span>
                      <button
                        onClick={() => setShowResetPasswordModal(true)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm rounded-md text-gray-700 hover:bg-gray-50 transition"
                      >
                        Reset Password
                      </button>
                      <button
                        onClick={handleDisableLogin}
                        className="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm rounded-md text-red-600 hover:bg-red-50 transition"
                      >
                        Disable Login
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500 font-medium">
                        No Login
                      </span>
                      <button
                        onClick={() => setShowEnableLoginModal(true)}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium transition"
                      >
                        Enable Login
                      </button>
                    </>
                  )}
                </div>
              </div>

              {staff.loginStatus?.enabled ? (
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                  <p>
                    Mobile Number:{' '}
                    <span className="font-medium text-gray-900">{staff.loginStatus.mobileNumber}</span>
                  </p>
                  <p className="mt-1">
                    Last Login:{' '}
                    <span className="font-medium text-gray-900">
                      {staff.loginStatus.lastLogin
                        ? new Date(staff.loginStatus.lastLogin).toLocaleString('en-IN')
                        : 'Never logged in'}
                    </span>
                  </p>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-700">
                  This staff member does not have mobile app access. Click "Enable Login" to create an account.
                </div>
              )}
            </div>

            {/* Payslip History */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <HiCurrencyRupee className="h-5 w-5 mr-2" />
                  Payslip History
                </h3>
                <div className="flex items-center space-x-3">
                  {payslips.length > 0 && (
                    <div className="text-sm text-gray-500">
                      Total: {payslips.length} payslips
                      {payslips[0] && (
                        <span className="ml-2">
                          Latest: {payslips[0].monthName} {payslips[0].year}
                        </span>
                      )}
                    </div>
                  )}
                  <button
                    onClick={() => setShowPayslipGenerator(true)}
                    disabled={!staff.salaryPerMonth}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    title={!staff.salaryPerMonth ? 'Staff member needs salary information to generate payslip' : 'Generate new payslip'}
                  >
                    <HiPlus className="h-4 w-4 mr-2" />
                    Generate Payslip
                  </button>
                </div>
              </div>

              {!staff.salaryPerMonth && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-700">
                    ⚠️ Salary information is required to generate payslips. Please update the staff member's salary details.
                  </p>
                </div>
              )}

              <PayslipList
                payslips={payslips}
                onViewPayslip={handleViewPayslip}
                isLoading={isLoadingPayslips}
              />

              {payslips.length > 5 && (
                <div className="mt-4 text-center">
                  <Link
                    to={`/dashboard/staff/payslips/${staff.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View All Payslips →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payslip Generator Modal */}
      {showPayslipGenerator && staff && (
        <PayslipGenerator
          staff={staff}
          isOpen={showPayslipGenerator}
          onClose={() => setShowPayslipGenerator(false)}
          onSuccess={handlePayslipGenerated}
        />
      )}

      {/* Payslip View Modal */}
      {selectedPayslip && (
        <PayslipView
          payslip={selectedPayslip}
          isOpen={!!selectedPayslip}
          onClose={() => setSelectedPayslip(null)}
          onPayslipUpdated={fetchPayslips}
        />
      )}

      {/* Enable Login Modal */}
      {showEnableLoginModal && staff && (
        <EnableLoginModal
          staff={staff}
          mode="enable"
          isOpen={showEnableLoginModal}
          onClose={() => setShowEnableLoginModal(false)}
          onSuccess={() => {
            setShowEnableLoginModal(false);
            setToast({ message: 'Login enabled successfully!', type: 'SUCCESS' });
            fetchStaffDetails();
          }}
        />
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && staff && (
        <EnableLoginModal
          staff={staff}
          mode="reset"
          isOpen={showResetPasswordModal}
          onClose={() => setShowResetPasswordModal(false)}
          onSuccess={() => {
            setShowResetPasswordModal(false);
            setToast({ message: 'Password reset successfully!', type: 'SUCCESS' });
          }}
        />
      )}
    </div>
  );
};

export default ViewStaffDetails;
