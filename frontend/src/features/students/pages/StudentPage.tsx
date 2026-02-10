import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import { FaPlus, FaSearch, FaUserGraduate } from "react-icons/fa";
import { FiUsers, FiTrendingUp, FiUserCheck } from 'react-icons/fi';
import StudentList from '../components/StudentList';
import AddStudentModal from '../components/AddStudentModal';
import EditStudentModal from '../components/EditStudentModal';
import DeleteStudentModal from '../components/DeleteStudentModal';
import { Student, Gender } from '../types';
import { studentApi } from '../api';
import { fetchClasses, ClassType, SectionType } from '../../class/api';

const StudentPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const isInitialMount = useRef(true);
  
  // Initialize state from URL params
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(() => {
    const classId = searchParams.get('classId');
    return classId ? parseInt(classId) : null;
  });
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(() => {
    const sectionId = searchParams.get('sectionId');
    return sectionId ? parseInt(sectionId) : null;
  });

  const { data: students = [], isLoading: loading } = useQuery<Student[]>(
    'fetchStudents',
    () => studentApi.getStudents(),
    {
      staleTime: 5 * 60 * 1000,
      keepPreviousData: true,
    }
  );

  const { data: classes = [] } = useQuery<ClassType[]>(
    'fetchClasses',
    fetchClasses
  );

  // Update URL params when filters change
  useEffect(() => {
    // Skip on initial mount since we already initialized from URL params
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (selectedClassId !== null) params.set('classId', selectedClassId.toString());
    if (selectedSectionId !== null) params.set('sectionId', selectedSectionId.toString());
    
    // Only update if params actually changed to avoid unnecessary updates
    const newParams = params.toString();
    const currentParams = searchParams.toString();
    if (currentParams !== newParams) {
      setSearchParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedClassId, selectedSectionId]);

  const handleAddStudent = () => {
    setShowAddModal(true);
  };

  // const handleEditStudent = (student: Student) => {
  //   setSelectedStudent(student);
  //   setShowEditModal(true);
  // };

  // const handleDeleteStudent = (student: Student) => {
  //   setSelectedStudent(student);
  //   setShowDeleteModal(true);
  // };

  const handleModalClose = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedStudent(null);
  };

  const handleSuccess = () => {
    handleModalClose();
    queryClient.invalidateQueries('fetchStudents');
  };

  const filteredStudents = students.filter(student => {
    // Search filter
    const matchesSearch = 
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Class filter
    const matchesClass = selectedClassId === null || student.classId === selectedClassId;
    
    // Section filter
    const matchesSection = selectedSectionId === null || student.sectionId === selectedSectionId;
    
    return matchesSearch && matchesClass && matchesSection;
  });

  // Get sections for selected class
  const availableSections: SectionType[] = selectedClassId 
    ? classes.find(c => c.id === selectedClassId)?.sections || []
    : [];

  // Handle class change - reset section filter
  const handleClassChange = (classId: string) => {
    const id = classId === 'all' ? null : parseInt(classId);
    setSelectedClassId(id);
    setSelectedSectionId(null); // Reset section when class changes
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setSelectedClassId(null);
    setSelectedSectionId(null);
    setSearchTerm('');
  };

  // Statistics cards data
  const stats = {
    total: students.length,
    active: students.filter(s => !s.deletedAt).length,
    male: students.filter(s => s.gender === Gender.MALE).length,
    female: students.filter(s => s.gender === Gender.FEMALE).length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
        <div className="px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <FaUserGraduate className="text-blue-200" />
                  Student Management
                </h1>
                <p className="text-blue-100 mt-2">Manage student records, enrollment, and academic information</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
                <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                  <FiTrendingUp className="w-4 h-4" />
                  <span>+12% from last month</span>
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <FiUsers className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Students</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.active}</p>
                <p className="text-sm text-blue-600 mt-2">
                  {((stats.active / stats.total) * 100).toFixed(1)}% of total
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <FiUserCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Male Students</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.male}</p>
                <p className="text-sm text-gray-600 mt-2">
                  {stats.total > 0 ? ((stats.male / stats.total) * 100).toFixed(1) : 0}% of total
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <div className="w-6 h-6 bg-blue-600 rounded-full"></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Female Students</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.female}</p>
                <p className="text-sm text-pink-600 mt-2">
                  {stats.total > 0 ? ((stats.female / stats.total) * 100).toFixed(1) : 0}% of total
                </p>
              </div>
              <div className="bg-pink-100 p-3 rounded-lg">
                <div className="w-6 h-6 bg-pink-600 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Actions Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="relative flex-1 max-w-lg">
              <FaSearch className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, admission number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <select
                  value={selectedClassId === null ? 'all' : selectedClassId.toString()}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px] text-sm"
                >
                  <option value="all">All Classes</option>
                  {classes.map((classItem) => (
                    <option key={classItem.id} value={classItem.id.toString()}>
                      {classItem.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex flex-col">
                <select
                  value={selectedSectionId === null ? 'all' : selectedSectionId.toString()}
                  onChange={(e) => setSelectedSectionId(e.target.value === 'all' ? null : parseInt(e.target.value))}
                  disabled={selectedClassId === null}
                  className="border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px] text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="all">All Sections</option>
                  {availableSections.map((section) => (
                    <option key={section.id} value={section.id.toString()}>
                      {section.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {(selectedClassId !== null || selectedSectionId !== null) && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors h-[42px]"
                >
                  Clear
                </button>
              )}
              
              <button
                onClick={handleAddStudent}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105 shadow-md text-sm font-medium h-[42px]"
              >
                <FaPlus className="w-4 h-4" />
                <span>Add Student</span>
              </button>
            </div>
          </div>
        </div>

        {/* Student List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <StudentList
            students={filteredStudents}
            loading={loading}
          />
        </div>
      </div>

      {/* Modals */}
      <AddStudentModal
        isOpen={showAddModal}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
      />

      {selectedStudent && (
        <>
          <EditStudentModal
            student={selectedStudent}
            isOpen={showEditModal}
            onClose={handleModalClose}
            onSuccess={handleSuccess}
          />
          <DeleteStudentModal
            student={selectedStudent}
            isOpen={showDeleteModal}
            onClose={handleModalClose}
            onSuccess={handleSuccess}
          />
        </>
      )}
    </div>
  );
};

export default StudentPage;
