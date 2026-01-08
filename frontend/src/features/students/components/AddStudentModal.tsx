import React, { useState, useEffect } from 'react';
import { X, Upload, XCircle } from 'lucide-react';
import { studentApi } from '../api';
import { useAppContext } from '../../../providers/AppContext'; 
import { CreateStudentRequest, Gender, Religion, BloodGroup } from '../types';

interface PhotoFile {
  file: File;
  preview: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ClassData {
  id: number;
  name: string;
  sections: Array<{ id: number; name: string }>;
}

const AddStudentModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const { showToast } = useAppContext();
  const [formData, setFormData] = useState({
    admissionDate: new Date().toISOString().split('T')[0], // Default to today
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '' as Gender | '',
    bloodGroup: '' as BloodGroup | '',
    religion: '' as Religion | '',
    aadhaarNumber: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    classId: null as number | null,
    sectionId: null as number | null,
    rollNumber: '',
    fatherName: '',
    fatherOccupation: '',
    fatherPhone: '',
    fatherAadharNumber: '',
    motherName: '',
    motherOccupation: '',
    motherPhone: '',
    guardianName: '',
    guardianRelation: '',
    guardianPhone: ''
  });
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
  const [loading, setLoading] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [sections, setSections] = useState<Array<{ id: number; name: string }>>([]);

  useEffect(() => {
    if (isOpen) {
      fetchClasses();
    }
  }, [isOpen]);

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
      showToast({ message: 'Failed to fetch classes' , type: "ERROR"})
    }
  };


  const handleClassChange = (classId: string) => {
    const classData = classes.find(c => c.id === parseInt(classId));
    if (classData) {
      setSections(classData.sections);
      setFormData(prev => ({ 
        ...prev, 
        classId: parseInt(classId),
        sectionId: null 
      }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
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
      'city', 'state', 'pincode', 'classId', 'sectionId',
      'fatherName', 'motherName', 'phone', 'aadhaarNumber'
    ];

    for (const field of requiredFields) {
      const value = (formData as any)[field];
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

    if (formData.classId === null || formData.sectionId === null) {
      showToast({ message: 'Class and section are required', type: "ERROR" });
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
      // Upload photos first if any are selected
      let photoUrls: { [key: string]: string } = {};
      const hasPhotos = Object.values(photoFiles).some(photo => photo !== null);
      
      if (hasPhotos) {
        try {
          photoUrls = await uploadPhotosToServer();
        } catch (error) {
          showToast({ message: 'Failed to upload photos. Please try again.', type: "ERROR" });
          setLoading(false);
          setUploadingPhotos(false);
          return;
        }
      }

      // Transform form data to match backend CreateStudentRequest
      const submitData: CreateStudentRequest = {
        admissionDate: formData.admissionDate,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email || undefined,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender as Gender,
        bloodGroup: formData.bloodGroup as BloodGroup,
        religion: formData.religion as Religion,
        aadhaarNumber: formData.aadhaarNumber,
        classId: formData.classId as number,
        sectionId: formData.sectionId as number,
        rollNumber: formData.rollNumber || undefined,
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
        // Add photo URLs if uploaded
        studentPhoto: photoUrls.studentPhoto || undefined,
        fatherPhoto: photoUrls.fatherPhoto || undefined,
        motherPhoto: photoUrls.motherPhoto || undefined,
        guardianPhoto: photoUrls.guardianPhoto || undefined,
      };

      const result = await studentApi.createStudent(submitData);
      
      if (result.success) {
        showToast({ message: 'Student added successfully', type: "SUCCESS" });
        onSuccess();
        handleClose();
      } else {
        showToast({ message: result.message || 'Failed to add student', type: "ERROR" });
      }
    } catch (error) {
      console.error('Error adding student:', error);
      showToast({ message: 'Failed to add student', type: "ERROR" });
    } finally {
      setLoading(false);
      setUploadingPhotos(false);
    }
  };

  const handleClose = () => {
    setFormData({
      admissionDate: new Date().toISOString().split('T')[0], // Reset to today
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '' as Gender | '',
      bloodGroup: '' as BloodGroup | '',
      religion: '' as Religion | '',
      aadhaarNumber: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      state: '',
      pincode:'',
      classId: null as number | null,
      sectionId: null as number | null,
      rollNumber: '',
      fatherName: '',
      fatherOccupation: '',
      fatherPhone: '',
      fatherAadharNumber: '',
      motherName: '',
      motherOccupation: '',
      motherPhone: '',
      guardianName: '',
      guardianRelation: '',
      guardianPhone: ''
    });
    setPhotoFiles({
      studentPhoto: null,
      fatherPhoto: null,
      motherPhoto: null,
      guardianPhoto: null
    });
    setSections([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Add New Student</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Admission Information */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Admission Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class <span className="text-red-500">*</span>
                </label>
                <select
                  name="classId"
                  value={formData.classId || ''}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Class</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
              {sections.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Section <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="sectionId"
                    value={formData.sectionId || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Section</option>
                    {sections.map(section => (
                      <option key={section.id} value={section.id}>{section.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Roll Number
                </label>
                <input
                  type="text"
                  name="rollNumber"
                  value={formData.rollNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admission Date
                </label>
                <input
                  type="date"
                  name="admissionDate"
                  value={formData.admissionDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              
              {/* Father Photo Upload */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Father Photo (Optional)
                </label>
                <div className="flex items-center gap-4">
                  {photoFiles.fatherPhoto ? (
                    <div className="relative">
                      <img
                        src={photoFiles.fatherPhoto.preview}
                        alt="Father preview"
                        className="w-24 h-24 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto('fatherPhoto')}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
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
              
              {/* Mother Photo Upload */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mother Photo (Optional)
                </label>
                <div className="flex items-center gap-4">
                  {photoFiles.motherPhoto ? (
                    <div className="relative">
                      <img
                        src={photoFiles.motherPhoto.preview}
                        alt="Mother preview"
                        className="w-24 h-24 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto('motherPhoto')}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
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
                    pattern="[6-9][0-9]{9}"
                  />
                </div>
              </div>
              
              {/* Guardian Photo Upload */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Guardian Photo (Optional)
                </label>
                <div className="flex items-center gap-4">
                  {photoFiles.guardianPhoto ? (
                    <div className="relative">
                      <img
                        src={photoFiles.guardianPhoto.preview}
                        alt="Guardian preview"
                        className="w-24 h-24 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto('guardianPhoto')}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
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

          {/* Photo Upload Section */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Student Photo (Optional)</h3>
            <div className="flex items-center gap-4">
              {photoFiles.studentPhoto ? (
                <div className="relative">
                  <img
                    src={photoFiles.studentPhoto.preview}
                    alt="Student preview"
                    className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto('studentPhoto')}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="text-sm text-gray-500 mt-2">Upload Photo</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={(e) => handlePhotoChange('studentPhoto', e)}
                    className="hidden"
                  />
                </label>
              )}
              <div className="text-sm text-gray-600">
                <p className="font-medium">Photo Requirements:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>JPEG, PNG, or WebP format</li>
                  <li>Maximum file size: 5MB</li>
                  <li>Recommended: Passport size photo</li>
                </ul>
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
              {loading ? 'Adding...' : 'Add Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStudentModal;
