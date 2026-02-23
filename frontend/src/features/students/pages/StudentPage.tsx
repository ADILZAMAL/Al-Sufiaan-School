import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import { FaPlus, FaSearch, FaUserGraduate } from "react-icons/fa";
import { FiUsers, FiTrendingUp } from 'react-icons/fi';
import StudentList from '../components/StudentList';
import AddStudentModal from '../components/AddStudentModal';
import EditStudentModal from '../components/EditStudentModal';
import DeleteStudentModal from '../components/DeleteStudentModal';
import { Student, Gender } from '../types';
import { studentApi } from '../api';
import SessionSelector from '../../sessions/components/SessionSelector';
import { academicSessionApi } from '../../sessions/api';
import { AcademicSession } from '../../sessions/types';
import { ClassType, SectionType } from '../../class/api';

const API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL || '';

const fetchClassesBySession = async (sessionId: number): Promise<ClassType[]> => {
  const response = await fetch(`${API_BASE_URL}/api/classes?sessionId=${sessionId}`, {
    credentials: 'include',
  });
  const body = await response.json();
  if (!body.success) throw new Error(body.message || 'Failed to fetch classes');
  return body.data;
};

const StudentPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const isInitialMount = useRef(true);

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
  const [activeFilter, setActiveFilter] = useState<boolean>(() => {
    const active = searchParams.get('active');
    return active === null ? true : active === 'true';
  });
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);

  // Fetch active session on mount to set default
  useQuery<AcademicSession | null>(
    'activeSession',
    academicSessionApi.getActiveSession,
    {
      staleTime: 5 * 60 * 1000,
      onSuccess: (session) => {
        if (session && selectedSessionId === null) {
          setSelectedSessionId(session.id);
        }
      },
    }
  );

  // Fetch classes for selected session
  const { data: classes = [] } = useQuery<ClassType[]>(
    ['fetchClasses', selectedSessionId],
    () => fetchClassesBySession(selectedSessionId!),
    {
      enabled: selectedSessionId !== null,
      staleTime: 5 * 60 * 1000,
    }
  );

  // Fetch students filtered by session
  const { data: students = [], isLoading: loading } = useQuery<Student[]>(
    ['fetchStudents', selectedSessionId],
    () => studentApi.getStudents(selectedSessionId ? { sessionId: selectedSessionId } : {}),
    {
      enabled: selectedSessionId !== null,
      staleTime: 5 * 60 * 1000,
      keepPreviousData: true,
    }
  );

  // Update URL params when filters change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (selectedClassId !== null) params.set('classId', selectedClassId.toString());
    if (selectedSectionId !== null) params.set('sectionId', selectedSectionId.toString());
    if (activeFilter !== true) params.set('active', activeFilter.toString());

    const newParams = params.toString();
    const currentParams = searchParams.toString();
    if (currentParams !== newParams) {
      setSearchParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedClassId, selectedSectionId, activeFilter]);

  const handleSessionChange = (sessionId: number) => {
    setSelectedSessionId(sessionId);
    setSelectedClassId(null);
    setSelectedSectionId(null);
  };

  const handleAddStudent = () => {
    setShowAddModal(true);
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedStudent(null);
  };

  const handleSuccess = () => {
    handleModalClose();
    queryClient.invalidateQueries(['fetchStudents', selectedSessionId]);
  };

  // Helper to get enrollment for a student in the current session
  const getEnrollment = (student: Student) => {
    if (!student.enrollments || student.enrollments.length === 0) return null;
    if (selectedSessionId) {
      return student.enrollments.find(e => e.sessionId === selectedSessionId) || student.enrollments[0];
    }
    return student.enrollments[0];
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch =
      !searchTerm ||
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const enrollment = getEnrollment(student);
    const matchesClass = selectedClassId === null || enrollment?.classId === selectedClassId;
    const matchesSection = selectedSectionId === null || enrollment?.sectionId === selectedSectionId;
    const matchesActive = student.active === activeFilter;

    return matchesSearch && matchesClass && matchesSection && matchesActive;
  });

  // Get sections for selected class
  const availableSections: SectionType[] = selectedClassId
    ? classes.find(c => c.id === selectedClassId)?.sections || []
    : [];

  const handleClassChange = (classId: string) => {
    const id = classId === 'all' ? null : parseInt(classId);
    setSelectedClassId(id);
    setSelectedSectionId(null);
  };

  const handleClearFilters = () => {
    setSelectedClassId(null);
    setSelectedSectionId(null);
    setSearchTerm('');
    setActiveFilter(true);
  };

  const stats = {
    total: filteredStudents.length,
    active: filteredStudents.filter(s => s.active).length,
    male: filteredStudents.filter(s => s.gender === Gender.MALE).length,
    female: filteredStudents.filter(s => s.gender === Gender.FEMALE).length,
    totalDue: filteredStudents.reduce((sum, student) => sum + (student.totalDue || 0), 0),
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
              <SessionSelector
                value={selectedSessionId}
                onChange={handleSessionChange}
                className="bg-white bg-opacity-10 rounded-lg px-3 py-2"
              />
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

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Due</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  ₹{stats.totalDue.toLocaleString('en-IN')}
                </p>
                <p className="text-sm text-orange-600 mt-2">
                  Outstanding fees
                </p>
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
                  disabled={selectedSessionId === null}
                  className="border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px] text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
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

              <div className="flex flex-col">
                <select
                  value={activeFilter ? 'active' : 'inactive'}
                  onChange={(e) => setActiveFilter(e.target.value === 'active')}
                  className="border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px] text-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {(selectedClassId !== null || selectedSectionId !== null || activeFilter !== true) && (
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
                disabled={selectedSessionId === null}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105 shadow-md text-sm font-medium h-[42px] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <FaPlus className="w-4 h-4" />
                <span>Add Student</span>
              </button>
            </div>
          </div>
        </div>

        {/* No session warning */}
        {selectedSessionId === null && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-center">
            <p className="text-amber-700 text-sm font-medium">No active academic session found. Please create and activate a session first.</p>
          </div>
        )}

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
        sessionId={selectedSessionId}
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
