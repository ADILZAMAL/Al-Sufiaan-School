import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { studentApi } from '../api';
import { useAppContext } from '../../../providers/AppContext';
import { Student, UpdateStudentRequest, Gender, Religion, BloodGroup, StudentFormData } from '../types';
import PhotoUpload from '../../../components/common/PhotoUpload';
import { enrollmentApi } from '../../sessions/api';
import { UpdateEnrollmentRequest } from '../../sessions/types';

interface PhotoFile {
  file: File;
  preview: string;
}

interface Props {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ClassData {
  id: number;
  name: string;
  sections: Array<{ id: number; name: string }>;
}

const EditStudentModal: React.FC<Props> = ({ student, isOpen, onClose, onSuccess }) => {
  const { showToast } = useAppContext();
  const [showEnrollmentEditor, setShowEnrollmentEditor] = useState(false);
  const [enrollmentEdit, setEnrollmentEdit] = useState<{ classId: number | null; sectionId: number | null; rollNumber: string }>({ classId: null, sectionId: null, rollNumber: '' });
  const [savingEnrollment, setSavingEnrollment] = useState(false);
  const [formData, setFormData] = useState<StudentFormData>({
    admissionNumber: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '' as any,
    bloodGroup: '' as any,
    religion: '' as any,
    aadhaarNumber: '',
    classId: null,
    sectionId: null,
    rollNumber: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    fatherName: '',
    fatherOccupation: '',
    fatherPhone: '',
    fatherAadharNumber: '',
    motherName: '',
    motherOccupation: '',
    motherPhone: '',
    guardianName: '',
    guardianRelation: '',
    guardianPhone: '',
    studentPhoto: '',
    fatherPhoto: '',
    motherPhoto: '',
    guardianPhoto: '',
    dayboarding: false,
    hostel: false,
    areaTransportationId: null
  });
  const [loading, setLoading] = useState(false);
  const [, setUploadingPhotos] = useState(false);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [transportationAreas, setTransportationAreas] = useState<Array<{ id: number; areaName: string; price: number }>>([]);
  const [photoFiles, setPhotoFiles] = useState<{
    studentPhoto: PhotoFile | null;
    fatherPhoto: PhotoFile | null;
    motherPhoto: PhotoFile | null;
    guardianPhoto: PhotoFile | null;
  }>({
    studentPhoto: null,
    fatherPhoto: null,
    motherPhoto: null,
    guardianPhoto: null
  });
  const [existingPhotos, setExistingPhotos] = useState<{
    studentPhoto?: string;
    fatherPhoto?: string;
    motherPhoto?: string;
    guardianPhoto?: string;
  }>({});

  useEffect(() => {
    if (isOpen) {
      fetchClasses();
      fetchTransportationAreas();
      // Populate form with student data
      setFormData({
        admissionNumber: student.admissionNumber,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email || '',
        phone: student.phone || '',
        dateOfBirth: student.dateOfBirth,
        gender: student.gender,
        bloodGroup: student.bloodGroup,
        religion: student.religion,
        aadhaarNumber: student.aadhaarNumber || '',
        classId: student.classId ?? null,
        sectionId: student.sectionId ?? null,
        rollNumber: student.rollNumber || '',
        address: student.address,
        city: student.city,
        state: student.state,
        pincode: student.pincode,
        fatherName: student.fatherName,
        fatherOccupation: student.fatherOccupation || '',
        fatherPhone: student.fatherPhone || '',
        fatherAadharNumber: student.fatherAadharNumber || '',
        motherName: student.motherName,
        motherOccupation: student.motherOccupation || '',
        motherPhone: student.motherPhone || '',
        guardianName: student.guardianName || '',
        guardianRelation: student.guardianRelation || '',
        guardianPhone: student.guardianPhone || '',
        studentPhoto: student.studentPhoto || '',
        fatherPhoto: student.fatherPhoto || '',
        motherPhoto: student.motherPhoto || '',
        guardianPhoto: student.guardianPhoto || '',
        dayboarding: student.dayboarding || false,
        hostel: student.hostel || false,
        areaTransportationId: student.areaTransportationId || null
      });
      // Store existing photos
      setExistingPhotos({
        studentPhoto: student.studentPhoto || '',
        fatherPhoto: student.fatherPhoto || '',
        motherPhoto: student.motherPhoto || '',
        guardianPhoto: student.guardianPhoto || ''
      });
      // Reset new photo files
      setPhotoFiles({
        studentPhoto: null,
        fatherPhoto: null,
        motherPhoto: null,
        guardianPhoto: null
      });
    }
  }, [isOpen, student]);

  const fetchTransportationAreas = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_BASE_URL}/api/transportation-area-pricing`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setTransportationAreas(data.data.transportationAreaPricing.filter((area: any) => area.isActive));
      }
    } catch (error) {
      console.error('Failed to fetch transportation areas:', error);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_BASE_URL}/api/classes`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setClasses(data.data);
      }
    } catch (error) {
      showToast({ message: 'Failed to fetch classes', type: "ERROR" });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    setFormData(prev => {
      const newData = { 
        ...prev,
        [name]: type === 'checkbox' ? checked : 
                 type === 'number' ? parseFloat(value) || 0 : value 
      };

      // Mutual exclusion: dayboarding and hostel cannot be selected together
      if (name === 'dayboarding' && checked === true) {
        newData.hostel = false;
        newData.areaTransportationId = null;
      }

      if (name === 'hostel' && checked === true) {
        newData.dayboarding = false;
        newData.areaTransportationId = null;
      }

      // Mutual exclusion: if transportation area is selected, clear hostel
      if (name === 'areaTransportationId' && value !== '') {
        newData.hostel = false;
      }

      return newData;
    });
  };

  const handlePhotoChange = (photoType: keyof typeof photoFiles, file: File, preview: string) => {
    setPhotoFiles(prev => ({
      ...prev,
      [photoType]: { file, preview }
    }));
  };

  const uploadPhotosToServer = async (): Promise<{ [key: string]: string }> => {
    const formDataToSend = new FormData();
    
    if (photoFiles.studentPhoto) {
      formDataToSend.append('studentPhoto', photoFiles.studentPhoto.file);
    }
    if (photoFiles.fatherPhoto) {
      formDataToSend.append('fatherPhoto', photoFiles.fatherPhoto.file);
    }
    if (photoFiles.motherPhoto) {
      formDataToSend.append('motherPhoto', photoFiles.motherPhoto.file);
    }
    if (photoFiles.guardianPhoto) {
      formDataToSend.append('guardianPhoto', photoFiles.guardianPhoto.file);
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API_BASE_URL}/api/photos/upload-student-photos`,
        {
          method: 'POST',
          credentials: 'include',
          body: formDataToSend
        }
      );

      const data = await response.json();
      
      if (data.success && data.data) {
        const photoUrls: { [key: string]: string } = {};
        if (data.data.studentPhoto?.url) photoUrls.studentPhoto = data.data.studentPhoto.url;
        if (data.data.fatherPhoto?.url) photoUrls.fatherPhoto = data.data.fatherPhoto.url;
        if (data.data.motherPhoto?.url) photoUrls.motherPhoto = data.data.motherPhoto.url;
        if (data.data.guardianPhoto?.url) photoUrls.guardianPhoto = data.data.guardianPhoto.url;
        return photoUrls;
      } else {
        throw new Error(data.message || 'Failed to upload photos');
      }
    } catch (error) {
      console.error('Error uploading photos:', error);
      throw error;
    }
  };

  const validateForm = () => {
    const requiredFields = [
      'firstName', 'lastName', 'dateOfBirth', 'gender', 'address', 
      'city', 'state', 'pincode', 'fatherName', 'motherName', 'phone', 'aadhaarNumber'
    ];

    for (const field of requiredFields) {
      const value = formData[field as keyof StudentFormData];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        showToast({ message: `${field.replace(/([A-Z])/g, ' $1').trim()} is required`, type: "ERROR" });
        return false;
      }
    }

    // Validate enum fields
    if (formData.gender === '') {
      showToast({ message: 'Please select a gender', type: "ERROR" });
      return false;
    }

    if (formData.bloodGroup === '') {
      showToast({ message: 'Please select a blood group', type: "ERROR" });
      return false;
    }

    if (formData.religion === '') {
      showToast({ message: 'Please select a religion', type: "ERROR" });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setUploadingPhotos(true);

    try {
      // Upload new photos if any are selected
      let photoUrls: { [key: string]: string } = {};
      const hasNewPhotos = Object.values(photoFiles).some(photo => photo !== null);
      
      if (hasNewPhotos) {
        try {
          photoUrls = await uploadPhotosToServer();
        } catch (error) {
          showToast({ message: 'Failed to upload photos. Please try again.', type: "ERROR" });
          setLoading(false);
          setUploadingPhotos(false);
          return;
        }
      }

      // Combine existing and new photo URLs
      const finalPhotos = {
        studentPhoto: photoUrls.studentPhoto || existingPhotos.studentPhoto || undefined,
        fatherPhoto: photoUrls.fatherPhoto || existingPhotos.fatherPhoto || undefined,
        motherPhoto: photoUrls.motherPhoto || existingPhotos.motherPhoto || undefined,
        guardianPhoto: photoUrls.guardianPhoto || existingPhotos.guardianPhoto || undefined,
      };

      // Transform form data to match backend UpdateStudentRequest
      const submitData: UpdateStudentRequest = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email || undefined,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender as Gender,
        bloodGroup: formData.bloodGroup as BloodGroup,
        religion: formData.religion as Religion,
        aadhaarNumber: formData.aadhaarNumber,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        fatherName: formData.fatherName,
        fatherPhone: formData.fatherPhone || undefined,
        fatherOccupation: formData.fatherOccupation || undefined,
        fatherAadharNumber: formData.fatherAadharNumber || undefined,
        motherName: formData.motherName,
        motherPhone: formData.motherPhone || undefined,
        motherOccupation: formData.motherOccupation || undefined,
        guardianName: formData.guardianName || undefined,
        guardianRelation: formData.guardianRelation || undefined,
        guardianPhone: formData.guardianPhone || undefined,
        dayboarding: formData.dayboarding,
        hostel: formData.hostel,
        areaTransportationId: formData.areaTransportationId || undefined,
        // Add photo URLs
        studentPhoto: finalPhotos.studentPhoto,
        fatherPhoto: finalPhotos.fatherPhoto,
        motherPhoto: finalPhotos.motherPhoto,
        guardianPhoto: finalPhotos.guardianPhoto,
      };

      const result = await studentApi.updateStudent(student.id, submitData);
      
      if (result.success) {
        showToast({ message: 'Student updated successfully', type: "SUCCESS" });
        onSuccess();
        handleClose();
      } else {
        showToast({ message: result.message || 'Failed to update student', type: "ERROR" });
      }
    } catch (error) {
      console.error('Error updating student:', error);
      showToast({ message: 'Failed to update student', type: "ERROR" });
    } finally {
      setLoading(false);
      setUploadingPhotos(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Edit Student</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Academic Information (Read-only) */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Academic Information</h3>
              {!showEnrollmentEditor && student.enrollments && student.enrollments.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const e = student.enrollments![0];
                    setEnrollmentEdit({ classId: e.classId, sectionId: e.sectionId, rollNumber: e.rollNumber || '' });
                    setShowEnrollmentEditor(true);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium underline"
                >
                  Change Class/Section
                </button>
              )}
            </div>
            {(() => {
              const enrollment = student.enrollments?.[0];
              const enrollClass = enrollment?.class;
              const enrollSection = enrollment?.section;
              const enrollRoll = enrollment?.rollNumber;
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Admission No.</label>
                    <input type="text" value={formData.admissionNumber} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600" disabled />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                    <input type="text" value={enrollClass?.name || ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600" disabled />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                    <input type="text" value={enrollSection?.name || ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600" disabled />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
                    <input type="text" value={enrollRoll || ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600" disabled />
                  </div>
                </div>
              );
            })()}
            {showEnrollmentEditor && (
              <div className="mt-4 p-4 border border-blue-200 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-800 mb-3">Update Class / Section / Roll</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Class</label>
                    <select
                      value={enrollmentEdit.classId ?? ''}
                      onChange={(e) => setEnrollmentEdit(prev => ({ ...prev, classId: parseInt(e.target.value) || null, sectionId: null }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Class</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Section</label>
                    <select
                      value={enrollmentEdit.sectionId ?? ''}
                      onChange={(e) => setEnrollmentEdit(prev => ({ ...prev, sectionId: parseInt(e.target.value) || null }))}
                      disabled={!enrollmentEdit.classId}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">Select Section</option>
                      {(classes.find(c => c.id === enrollmentEdit.classId)?.sections || []).map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Roll Number</label>
                    <input
                      type="text"
                      value={enrollmentEdit.rollNumber}
                      onChange={(e) => setEnrollmentEdit(prev => ({ ...prev, rollNumber: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      placeholder="Optional"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    disabled={savingEnrollment || !enrollmentEdit.classId || !enrollmentEdit.sectionId}
                    onClick={async () => {
                      const enrollment = student.enrollments?.[0];
                      if (!enrollment) return;
                      setSavingEnrollment(true);
                      try {
                        const update: UpdateEnrollmentRequest = {
                          classId: enrollmentEdit.classId ?? undefined,
                          sectionId: enrollmentEdit.sectionId ?? undefined,
                          rollNumber: enrollmentEdit.rollNumber || undefined,
                        };
                        await enrollmentApi.updateEnrollment(enrollment.id, update);
                        showToast({ message: 'Class/Section updated successfully', type: 'SUCCESS' });
                        setShowEnrollmentEditor(false);
                        onSuccess();
                      } catch (err: any) {
                        showToast({ message: err.message || 'Failed to update enrollment', type: 'ERROR' });
                      } finally {
                        setSavingEnrollment(false);
                      }
                    }}
                    className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingEnrollment ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEnrollmentEditor(false)}
                    className="px-4 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Services Section */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Services</h3>
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="dayboarding"
                  checked={formData.dayboarding}
                  onChange={handleInputChange}
                  disabled={formData.hostel}
                  className={`w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 ${
                    formData.hostel ? 'cursor-not-allowed' : ''
                  }`}
                />
                <span className="ml-3 text-sm font-medium text-gray-700">
                  Dayboarding Service
                </span>
              </label>
              <p className="mt-1 text-xs text-gray-500 ml-8">
                Students opting for dayboarding service will be charged a fixed dayboarding fee in addition to tuition fee
              </p>
              {formData.hostel && (
                <p className="mt-1 text-xs text-orange-500 ml-8">
                  Not available with hostel service
                </p>
              )}
            </div>
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="hostel"
                  checked={formData.hostel}
                  onChange={handleInputChange}
                  disabled={formData.dayboarding}
                  className={`w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500 ${
                    formData.dayboarding ? 'cursor-not-allowed' : ''
                  }`}
                />
                <span className="ml-3 text-sm font-medium text-gray-700">
                  Hostel Service
                </span>
              </label>
              <p className="mt-1 text-xs text-gray-500 ml-8">
                Students opting for hostel service will be charged a fixed hostel fee in addition to tuition fee
              </p>
              {formData.dayboarding && (
                <p className="mt-1 text-xs text-orange-500 ml-8">
                  Not available with dayboarding service
                </p>
              )}
            </div>
            <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transportation Area
              </label>
              <select
                name="areaTransportationId"
                value={formData.areaTransportationId || ''}
                onChange={handleInputChange}
                disabled={formData.hostel}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  formData.hostel ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''
                }`}
              >
                <option value="">No Transportation</option>
                {transportationAreas.map(area => (
                  <option key={area.id} value={area.id}>
                    {area.areaName} - ₹{area.price}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {formData.hostel 
                  ? 'Transportation is not available for hostel students' 
                  : 'Students will be charged transportation fee based on selected area'}
              </p>
            </div>
          </div>

          {/* Personal Information */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Gender</option>
                  {Object.values(Gender).map(gender => (
                    <option key={gender} value={gender}>{gender.charAt(0).toUpperCase() + gender.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Blood Group <span className="text-red-500">*</span>
                </label>
                <select
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Blood Group</option>
                  {Object.values(BloodGroup).map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Religion <span className="text-red-500">*</span>
                </label>
                <select
                  name="religion"
                  value={formData.religion}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Religion</option>
                  {Object.values(Religion).map(rel => (
                    <option key={rel} value={rel}>{rel}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Aadhaar Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="aadhaarNumber"
                  value={formData.aadhaarNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  maxLength={12}
                  pattern="[0-9]{12}"
                />
              </div>
            </div>

            {/* Student Photo */}
            <div className="mt-6">
              <PhotoUpload
                file={photoFiles.studentPhoto?.file || null}
                preview={photoFiles.studentPhoto?.preview || existingPhotos.studentPhoto || null}
                onChange={(file, preview) => handlePhotoChange('studentPhoto', file, preview)}
                onRemove={() => {
                  setPhotoFiles(prev => ({ ...prev, studentPhoto: null }));
                  setExistingPhotos(prev => ({ ...prev, studentPhoto: '' }));
                }}
                label="Student Photo"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  pattern="[6-9][0-9]{9}"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address <span className="text-red-500">*</span>
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pin Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  maxLength={6}
                  pattern="[0-9]{6}"
                />
              </div>
            </div>
          </div>

          {/* Father Information */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Father Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fatherName"
                  value={formData.fatherName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="fatherPhone"
                  value={formData.fatherPhone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  pattern="[6-9][0-9]{9}"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Occupation
                </label>
                <input
                  type="text"
                  name="fatherOccupation"
                  value={formData.fatherOccupation}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Aadhar Number (Optional)
                </label>
                <input
                  type="text"
                  name="fatherAadharNumber"
                  value={formData.fatherAadharNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={12}
                  pattern="[0-9]{12}"
                  placeholder="12-digit Aadhar number"
                />
              </div>
            </div>
            
            {/* Father Photo */}
            <div className="mt-6">
              <PhotoUpload
                file={photoFiles.fatherPhoto?.file || null}
                preview={photoFiles.fatherPhoto?.preview || existingPhotos.fatherPhoto || null}
                onChange={(file, preview) => handlePhotoChange('fatherPhoto', file, preview)}
                onRemove={() => {
                  setPhotoFiles(prev => ({ ...prev, fatherPhoto: null }));
                  setExistingPhotos(prev => ({ ...prev, fatherPhoto: '' }));
                }}
                label="Father Photo"
              />
            </div>
          </div>

          {/* Mother Information */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Mother Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="motherName"
                  value={formData.motherName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="motherPhone"
                  value={formData.motherPhone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  pattern="[6-9][0-9]{9}"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Occupation
                </label>
                <input
                  type="text"
                  name="motherOccupation"
                  value={formData.motherOccupation}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Mother Photo */}
            <div className="mt-6">
              <PhotoUpload
                file={photoFiles.motherPhoto?.file || null}
                preview={photoFiles.motherPhoto?.preview || existingPhotos.motherPhoto || null}
                onChange={(file, preview) => handlePhotoChange('motherPhoto', file, preview)}
                onRemove={() => {
                  setPhotoFiles(prev => ({ ...prev, motherPhoto: null }));
                  setExistingPhotos(prev => ({ ...prev, motherPhoto: '' }));
                }}
                label="Mother Photo"
              />
            </div>
          </div>

          {/* Guardian Information */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Guardian Information (if applicable)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  name="guardianName"
                  value={formData.guardianName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Relationship
                </label>
                <input
                  type="text"
                  name="guardianRelation"
                  value={formData.guardianRelation}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Uncle, Aunt, Grandparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="guardianPhone"
                  value={formData.guardianPhone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  pattern="[6-9][0-9]{9]"
                />
              </div>
            </div>
            
            {/* Guardian Photo */}
            <div className="mt-6">
              <PhotoUpload
                file={photoFiles.guardianPhoto?.file || null}
                preview={photoFiles.guardianPhoto?.preview || existingPhotos.guardianPhoto || null}
                onChange={(file, preview) => handlePhotoChange('guardianPhoto', file, preview)}
                onRemove={() => {
                  setPhotoFiles(prev => ({ ...prev, guardianPhoto: null }));
                  setExistingPhotos(prev => ({ ...prev, guardianPhoto: '' }));
                }}
                label="Guardian Photo"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditStudentModal;
