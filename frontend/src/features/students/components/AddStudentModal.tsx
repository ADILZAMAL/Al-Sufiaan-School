// import React, { useState, useEffect } from 'react';
// import { X, Plus, Trash2 } from 'lucide-react';
// import { studentApi } from '../api';
// import { useAppContext } from '../../../providers/AppContext'; 
// import { CreateStudentRequest, GENDER, RELIGION, STUDENT_STATUS, BLOOD_GROUP } from '../types';

// interface Props {
//   isOpen: boolean;
//   onClose: () => void;
//   onSuccess: () => void;
// }

// interface ClassData {
//   id: number;
//   name: string;
//   sections: Array<{ id: number; name: string }>;
// }

// interface Guardian {
//   name: string;
//   relationship: string;
//   phone: string;
//   email?: string;
//   occupation?: string;
//   address?: string;
// }

// const AddStudentModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
//   const initialFormData: CreateStudentRequest = {
//     admissionNo: '',
//     firstName: '',
//     lastName: '',
//     dateOfBirth: '',
//     gender: GENDER.MALE,
//     bloodGroup: BLOOD_GROUP.A_POSITIVE,
//     religion: RELIGION.ISLAM,
//     address: '',
//     city: '',
//     state: '',
//     pincode: '',
//     country: 'India',
//     phone: '',
//     email: '',
//     classId: 0,
//     sectionId: 0,
//     admissionDate: new Date().toISOString().split('T')[0],
//     status: STUDENT_STATUS.ACTIVE,
//     previousSchool: '',
//     aadharNumber: '',
//     bankName: '',
//     bankAccountNo: '',
//     bankIfsc: '',
//     bankBranch: '',
//     hostelRequired: false,
//     transportationRequired: false,
//     medicalConditions: '',
//     allergies: '',
//   };
//   const { showToast } = useAppContext();
//   const [formData, setFormData] = useState<CreateStudentRequest>(initialFormData);
//   const [loading, setLoading] = useState(false);
//   const [classes, setClasses] = useState<ClassData[]>([]);
//   const [sections, setSections] = useState<Array<{ id: number; name: string }>>([]);
//   const [guardians, setGuardians] = useState<Guardian[]>([
//     { name: '', relationship: 'Father', phone: '', email: '', occupation: '', address: '' }
//   ]);
//   const [documents, setDocuments] = useState<{ [key: string]: File | null }>({});

//   useEffect(() => {
//     if (isOpen) {
//       fetchClasses();
//       getNextAdmissionNo();
//     }
//   }, [isOpen]);

//   const fetchClasses = async () => {
//     try {
//       const response = await fetch(`${import.meta.env.VITE_BACKEND_API_BASE_URL}/api/classes`, {
//         credentials: 'include',
//       });
//       const data = await response.json();
//       if (data.success) {
//         setClasses(data.data);
//       }
//     } catch (error) {
//       showToast({ message: 'Failed to fetch classes' , type: "ERROR"})
//     }
//   };

//   const getNextAdmissionNo = async () => {
//     try {
//       const result = await studentApi.getNextAdmissionNo();
//       if (result.success) {
//         setFormData(prev => ({ ...prev, admissionNo: result.admissionNo }));
//       }
//     } catch (error) {
//       console.error('Failed to get next admission number:', error);
//     }
//   };

//   const handleClassChange = (classId: string) => {
//     const classData = classes.find(c => c.id === parseInt(classId));
//     if (classData) {
//       setSections(classData.sections);
//       setFormData(prev => ({ 
//         ...prev, 
//         classId: parseInt(classId),
//         sectionId: 0 
//       }));
//     }
//   };

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
//     const { name, value, type } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
//                type === 'number' ? parseFloat(value) || 0 : value
//     }));
//   };

//   const handleGuardianChange = (index: number, field: keyof Guardian, value: string) => {
//     const updatedGuardians = [...guardians];
//     updatedGuardians[index] = { ...updatedGuardians[index], [field]: value };
//     setGuardians(updatedGuardians);
//   };

//   const addGuardian = () => {
//     setGuardians([...guardians, { 
//       name: '', 
//       relationship: 'Mother', 
//       phone: '', 
//       email: '', 
//       occupation: '', 
//       address: '' 
//     }]);
//   };

//   const removeGuardian = (index: number) => {
//     if (guardians.length > 1) {
//       setGuardians(guardians.filter((_, i) => i !== index));
//     }
//   };

//   // const handleDocumentChange = (docType: string, file: File | null) => {
//   //   setDocuments(prev => ({ ...prev, [docType]: file }));
//   // };

//   const validateForm = () => {
//     const requiredFields = [
//       'firstName', 'lastName', 'dateOfBirth', 'gender', 'address', 
//       'city', 'state', 'pincode', 'classId', 'sectionId'
//     ];

//     for (const field of requiredFields) {
//       if (!formData[field as keyof CreateStudentRequest]) {
//         showToast({ message: `${field.replace(/([A-Z])/g, ' $1').trim()} is required`, type: "ERROR" });
//         return false;
//       }
//     }

//     if (guardians.some(g => !g.name || !g.phone)) {
//       showToast({ message: 'Guardian name and phone are required', type: "ERROR" });
//       return false;
//     }

//     return true;
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
    
//     if (!validateForm()) return;

//     setLoading(true);
//     try {
//       // Create FormData for file uploads
//       const submitData = new FormData();
      
//       // Add form fields
//       Object.keys(formData).forEach(key => {
//         const value = formData[key as keyof CreateStudentRequest];
//         if (value !== undefined && value !== null) {
//           submitData.append(key, value.toString());
//         }
//       });

//       // Add guardians
//       submitData.append('guardians', JSON.stringify(guardians));

//       // Add documents
//       Object.entries(documents).forEach(([key, file]) => {
//         if (file) {
//           submitData.append(key, file);
//         }
//       });

//       const response = await fetch(`${import.meta.env.VITE_BACKEND_API_BASE_URL}/api/students`, {
//         method: 'POST',
//         credentials: 'include',
//         body: submitData,
//       });

//       const result = await response.json();
      
//       if (result.success) {
//         showToast({ message: 'Student added successfully', type: "SUCCESS" });
//         onSuccess();
//         handleClose();
//       } else {
//         showToast({ message: result.message || 'Failed to add student', type: "ERROR" });
//       }
//     } catch (error) {
//       console.error('Error adding student:', error);
//       showToast({ message: 'Failed to add student', type: "ERROR" });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleClose = () => {
//     setFormData(initialFormData);
//     setGuardians([{ name: '', relationship: 'Father', phone: '', email: '', occupation: '', address: '' }]);
//     setDocuments({});
//     setSections([]);
//     onClose();
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
//       <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
//         <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
//           <h2 className="text-xl font-semibold text-gray-900">Add New Student</h2>
//           <button
//             onClick={handleClose}
//             className="text-gray-400 hover:text-gray-600 transition-colors"
//           >
//             <X className="w-5 h-5" />
//           </button>
//         </div>

//         <form onSubmit={handleSubmit} className="p-6 space-y-6">
//           {/* Admission Information */}
//           <div className="border border-gray-200 rounded-lg p-4">
//             <h3 className="text-lg font-medium text-gray-900 mb-4">Admission Information</h3>
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Admission No. <span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   type="text"
//                   name="admissionNo"
//                   value={formData.admissionNo}
//                   onChange={handleInputChange}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   required
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Admission Date <span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   type="date"
//                   name="admissionDate"
//                   value={formData.admissionDate}
//                   onChange={handleInputChange}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   required
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Class <span className="text-red-500">*</span>
//                 </label>
//                 <select
//                   name="classId"
//                   value={formData.classId}
//                   onChange={(e) => handleClassChange(e.target.value)}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   required
//                 >
//                   <option value="">Select Class</option>
//                   {classes.map(cls => (
//                     <option key={cls.id} value={cls.id}>{cls.name}</option>
//                   ))}
//                 </select>
//               </div>
//               {sections.length > 0 && (
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Section <span className="text-red-500">*</span>
//                   </label>
//                   <select
//                     name="sectionId"
//                     value={formData.sectionId}
//                     onChange={handleInputChange}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     required
//                   >
//                     <option value="">Select Section</option>
//                     {sections.map(section => (
//                       <option key={section.id} value={section.id}>{section.name}</option>
//                     ))}
//                   </select>
//                 </div>
//               )}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Status
//                 </label>
//                 <select
//                   name="status"
//                   value={formData.status}
//                   onChange={handleInputChange}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 >
//                   {Object.values(STUDENT_STATUS).map(status => (
//                     <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
//                   ))}
//                 </select>
//               </div>
//             </div>
//           </div>

//           {/* Personal Information */}
//           <div className="border border-gray-200 rounded-lg p-4">
//             <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   First Name <span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   type="text"
//                   name="firstName"
//                   value={formData.firstName}
//                   onChange={handleInputChange}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   required
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Last Name <span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   type="text"
//                   name="lastName"
//                   value={formData.lastName}
//                   onChange={handleInputChange}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   required
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Date of Birth <span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   type="date"
//                   name="dateOfBirth"
//                   value={formData.dateOfBirth}
//                   onChange={handleInputChange}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   required
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Gender <span className="text-red-500">*</span>
//                 </label>
//                 <select
//                   name="gender"
//                   value={formData.gender}
//                   onChange={handleInputChange}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   required
//                 >
//                   {Object.values(GENDER).map(gender => (
//                     <option key={gender} value={gender}>{gender.charAt(0).toUpperCase() + gender.slice(1)}</option>
//                   ))}
//                 </select>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Blood Group
//                 </label>
//                 <select
//                   name="bloodGroup"
//                   value={formData.bloodGroup}
//                   onChange={handleInputChange}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 >
//                   {Object.values(BLOOD_GROUP).map(bg => (
//                     <option key={bg} value={bg}>{bg}</option>
//                   ))}
//                 </select>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Religion
//                 </label>
//                 <select
//                   name="religion"
//                   value={formData.religion}
//                   onChange={handleInputChange}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 >
//                   {Object.values(RELIGION).map(rel => (
//                     <option key={rel} value={rel}>{rel}</option>
//                   ))}
//                 </select>
//               </div>
//             </div>
//           </div>

//           {/* Contact Information */}
//           <div className="border border-gray-200 rounded-lg p-4">
//             <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Phone <span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   type="tel"
//                   name="phone"
//                   value={formData.phone}
//                   onChange={handleInputChange}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   required
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Email
//                 </label>
//                 <input
//                   type="email"
//                   name="email"
//                   value={formData.email}
//                   onChange={handleInputChange}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 />
//               </div>
//             </div>
//             <div className="mt-4">
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Address <span className="text-red-500">*</span>
//               </label>
//               <textarea
//                 name="address"
//                 value={formData.address}
//                 onChange={handleInputChange}
//                 rows={2}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 required
//               />
//             </div>
//             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   City <span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   type="text"
//                   name="city"
//                   value={formData.city}
//                   onChange={handleInputChange}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   required
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   State <span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   type="text"
//                   name="state"
//                   value={formData.state}
//                   onChange={handleInputChange}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   required
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Pin Code <span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   type="text"
//                   name="pincode"
//                   value={formData.pincode}
//                   onChange={handleInputChange}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   required
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Country
//                 </label>
//                 <input
//                   type="text"
//                   name="country"
//                   value={formData.country}
//                   onChange={handleInputChange}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 />
//               </div>
//             </div>
//           </div>

//           {/* Guardian Information */}
//           <div className="border border-gray-200 rounded-lg p-4">
//             <h3 className="text-lg font-medium text-gray-900 mb-4">Guardian Information</h3>
//             {guardians.map((guardian, index) => (
//               <div key={index} className="mb-4 p-4 border border-gray-200 rounded-lg">
//                 <div className="flex justify-between items-center mb-3">
//                   <h4 className="font-medium text-gray-900">Guardian {index + 1}</h4>
//                   {guardians.length > 1 && (
//                     <button
//                       type="button"
//                       onClick={() => removeGuardian(index)}
//                       className="text-red-600 hover:text-red-800"
//                     >
//                       <Trash2 className="w-4 h-4" />
//                     </button>
//                   )}
//                 </div>
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Relationship <span className="text-red-500">*</span>
//                     </label>
//                     <select
//                       value={guardian.relationship}
//                       onChange={(e) => handleGuardianChange(index, 'relationship', e.target.value)}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     >
//                       <option value="Father">Father</option>
//                       <option value="Mother">Mother</option>
//                       <option value="Guardian">Guardian</option>
//                       <option value="Other">Other</option>
//                     </select>
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Name <span className="text-red-500">*</span>
//                     </label>
//                     <input
//                       type="text"
//                       value={guardian.name}
//                       onChange={(e) => handleGuardianChange(index, 'name', e.target.value)}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                       required
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Phone <span className="text-red-500">*</span>
//                     </label>
//                     <input
//                       type="tel"
//                       value={guardian.phone}
//                       onChange={(e) => handleGuardianChange(index, 'phone', e.target.value)}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                       required
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Email
//                     </label>
//                     <input
//                       type="email"
//                       value={guardian.email}
//                       onChange={(e) => handleGuardianChange(index, 'email', e.target.value)}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Occupation
//                     </label>
//                     <input
//                       type="text"
//                       value={guardian.occupation}
//                       onChange={(e) => handleGuardianChange(index, 'occupation', e.target.value)}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Address
//                     </label>
//                     <input
//                       type="text"
//                       value={guardian.address}
//                       onChange={(e) => handleGuardianChange(index, 'address', e.target.value)}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     />
//                   </div>
//                 </div>
//               </div>
//             ))}
//             <button
//               type="button"
//               onClick={addGuardian}
//               className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
//             >
//               <Plus className="w-4 h-4" />
//               Add Guardian
//             </button>
//           </div>

//           {/* Additional Information */}
//           <div className="border border-gray-200 rounded-lg p-4">
//             <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Previous School
//                 </label>
//                 <input
//                   type="text"
//                   name="previousSchool"
//                   value={formData.previousSchool}
//                   onChange={handleInputChange}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Aadhar Number
//                 </label>
//                 <input
//                   type="text"
//                   name="aadharNumber"
//                   value={formData.aadharNumber}
//                   onChange={handleInputChange}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 />
//               </div>
//             </div>
//             <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div className="flex items-center">
//                 <input
//                   type="checkbox"
//                   name="hostelRequired"
//                   checked={formData.hostelRequired}
//                   onChange={handleInputChange}
//                   className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
//                 />
//                 <label className="ml-2 text-sm font-medium text-gray-700">
//                   Hostel Required
//                 </label>
//               </div>
//               <div className="flex items-center">
//                 <input
//                   type="checkbox"
//                   name="transportationRequired"
//                   checked={formData.transportationRequired}
//                   onChange={handleInputChange}
//                   className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
//                 />
//                 <label className="ml-2 text-sm font-medium text-gray-700">
//                   Transport Required
//                 </label>
//               </div>
//             </div>
//             <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Medical Conditions
//                 </label>
//                 <textarea
//                   name="medicalConditions"
//                   value={formData.medicalConditions}
//                   onChange={handleInputChange}
//                   rows={2}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Allergies
//                 </label>
//                 <textarea
//                   name="allergies"
//                   value={formData.allergies}
//                   onChange={handleInputChange}
//                   rows={2}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 />
//               </div>
//             </div>
//           </div>

//           {/* Form Actions */}
//           <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
//             <button
//               type="button"
//               onClick={handleClose}
//               className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               disabled={loading}
//               className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               {loading ? 'Adding...' : 'Add Student'}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default AddStudentModal;
