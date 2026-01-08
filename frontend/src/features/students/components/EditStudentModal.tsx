import React, { useState, useEffect } from 'react';
import { X, Upload, XCircle } from 'lucide-react';
import { studentApi } from '../api';
import { useAppContext } from '../../../providers/AppContext'; 
import { Student, UpdateStudentRequest, Gender, Religion, BloodGroup, StudentFormData } from '../types';

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
    guardianPhoto: ''
  });
  const [loading, setLoading] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [classes, setClasses] = useState<ClassData[]>([]);
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
        classId: student.classId,
        sectionId: student.sectionId,
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
        guardianPhoto: student.guardianPhoto || ''
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
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
               type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handlePhotoChange = (photoType: keyof typeof photoFiles, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showToast({ message: 'Only JPEG, PNG, and WebP images are allowed', type: "ERROR" });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast({ message: 'Image size must be less than 5MB', type: "ERROR" });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoFiles(prev => ({
        ...prev,
        [photoType]: {
          file: file,
          preview: reader.result as string
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = (photoType: keyof typeof photoFiles) => {
    setPhotoFiles(prev => ({
      ...prev,
      [photoType]: null
    }));
  };

  const handleRemoveExistingPhoto = (photoType: keyof typeof existingPhotos) => {
    setExistingPhotos(prev => ({
      ...prev,
      [photoType]: ''
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
            <h3 className="text-lg font-medium text-gray-900 mb-4">Academic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admission No.
                </label>
                <input
                  type="text"
                  name="admissionNumber"
                  value={formData.admissionNumber}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class
                </label>
                <input
                  type="text"
                  value={classes.find(c => c.id === formData.classId)?.name || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Section
                </label>
                <input
                  type="text"
                  value={classes.find(c => c.id === formData.classId)?.sections.find(s => s.id === formData.sectionId)?.name || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Roll Number
                </label>
                <input
                  type="text"
                  name="rollNumber"
                  value={formData.rollNumber}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  disabled
                />
              </div>
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

          {/* Photo Upload Section */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Photos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Student Photo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Student Photo</label>
                <div className="flex flex-col items-center gap-2">
                  {photoFiles.studentPhoto ? (
                    <div className="relative">
                      <img
                        src={photoFiles.studentPhoto.preview}
                        alt="Student preview"
                        className="w-24 h-24 rounded-lg object-cover border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto('studentPhoto')}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ) : existingPhotos.studentPhoto ? (
                    <div className="relative">
                      <img
                        src={existingPhotos.studentPhoto}
                        alt="Current student photo"
                        className="w-24 h-24 rounded-lg object-cover border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingPhoto('studentPhoto')}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        title="Remove photo"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                      <Upload className="w-6 h-6 text-gray-400" />
                      <span className="text-xs text-gray-500 mt-1">Upload</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={(e) => handlePhotoChange('studentPhoto', e)}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Father Photo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Father Photo</label>
                <div className="flex flex-col items-center gap-2">
                  {photoFiles.fatherPhoto ? (
                    <div className="relative">
                      <img
                        src={photoFiles.fatherPhoto.preview}
                        alt="Father preview"
                        className="w-24 h-24 rounded-lg object-cover border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto('fatherPhoto')}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ) : existingPhotos.fatherPhoto ? (
                    <div className="relative">
                      <img
                        src={existingPhotos.fatherPhoto}
                        alt="Current father photo"
                        className="w-24 h-24 rounded-lg object-cover border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingPhoto('fatherPhoto')}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        title="Remove photo"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                      <Upload className="w-6 h-6 text-gray-400" />
                      <span className="text-xs text-gray-500 mt-1">Upload</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={(e) => handlePhotoChange('fatherPhoto', e)}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Mother Photo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mother Photo</label>
                <div className="flex flex-col items-center gap-2">
                  {photoFiles.motherPhoto ? (
                    <div className="relative">
                      <img
                        src={photoFiles.motherPhoto.preview}
                        alt="Mother preview"
                        className="w-24 h-24 rounded-lg object-cover border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto('motherPhoto')}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ) : existingPhotos.motherPhoto ? (
                    <div className="relative">
                      <img
                        src={existingPhotos.motherPhoto}
                        alt="Current mother photo"
                        className="w-24 h-24 rounded-lg object-cover border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingPhoto('motherPhoto')}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        title="Remove photo"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                      <Upload className="w-6 h-6 text-gray-400" />
                      <span className="text-xs text-gray-500 mt-1">Upload</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={(e) => handlePhotoChange('motherPhoto', e)}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Guardian Photo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Guardian Photo</label>
                <div className="flex flex-col items-center gap-2">
                  {photoFiles.guardianPhoto ? (
                    <div className="relative">
                      <img
                        src={photoFiles.guardianPhoto.preview}
                        alt="Guardian preview"
                        className="w-24 h-24 rounded-lg object-cover border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto('guardianPhoto')}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ) : existingPhotos.guardianPhoto ? (
                    <div className="relative">
                      <img
                        src={existingPhotos.guardianPhoto}
                        alt="Current guardian photo"
                        className="w-24 h-24 rounded-lg object-cover border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingPhoto('guardianPhoto')}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        title="Remove photo"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                      <Upload className="w-6 h-6 text-gray-400" />
                      <span className="text-xs text-gray-500 mt-1">Upload</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={(e) => handlePhotoChange('guardianPhoto', e)}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Parent/Guardian Information */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Parent/Guardian Information</h3>
            
            {/* Father Information */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Father Information</h4>
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
            </div>

            {/* Mother Information */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Mother Information</h4>
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
            </div>

            {/* Guardian Information */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Guardian Information (if applicable)</h4>
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
