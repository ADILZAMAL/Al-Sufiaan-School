import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import { FaPlus, FaSearch, FaUserGraduate, FaMale, FaFemale } from 'react-icons/fa';
import { FiUsers, FiXCircle } from 'react-icons/fi';
import { HiCurrencyRupee } from 'react-icons/hi';
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
  const [manualSessionId, setManualSessionId] = useState<number | null>(null);

  const { data: activeSession, isLoading: sessionLoading } = useQuery<AcademicSession | null>(
    'activeSession',
    academicSessionApi.getActiveSession,
    { staleTime: 5 * 60 * 1000 }
  );

  const selectedSessionId = manualSessionId ?? activeSession?.id ?? null;

  const { data: classes = [] } = useQuery<ClassType[]>(
    ['fetchClasses', selectedSessionId],
    () => fetchClassesBySession(selectedSessionId!),
    {
      enabled: selectedSessionId !== null,
      staleTime: 5 * 60 * 1000,
    }
  );

  const { data: students = [], isLoading: loading } = useQuery<Student[]>(
    ['fetchStudents', selectedSessionId],
    () => studentApi.getStudents(selectedSessionId ? { sessionId: selectedSessionId } : {}),
    {
      enabled: selectedSessionId !== null,
      staleTime: 5 * 60 * 1000,
      keepPreviousData: true,
    }
  );

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
    setManualSessionId(sessionId);
    setSelectedClassId(null);
    setSelectedSectionId(null);
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

  const availableSections: SectionType[] = selectedClassId
    ? classes.find(c => c.id === selectedClassId)?.sections || []
    : [];

  const handleClassChange = (classId: string) => {
    const id = classId === 'all' ? null : parseInt(classId);
    setSelectedClassId(id);
    setSelectedSectionId(null);
  };

  const hasActiveFilters = selectedClassId !== null || selectedSectionId !== null || searchTerm !== '';

  const handleClearFilters = () => {
    setSelectedClassId(null);
    setSelectedSectionId(null);
    setSearchTerm('');
  };

  const stats = {
    total: filteredStudents.length,
    male: filteredStudents.filter(s => s.gender === Gender.MALE).length,
    female: filteredStudents.filter(s => s.gender === Gender.FEMALE).length,
    totalDue: filteredStudents.reduce((sum, student) => sum + (student.totalDue || 0), 0),
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FaUserGraduate className="text-blue-600" />
              Student Management
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage student records, enrollment, and academic information</p>
          </div>
          <div className="flex items-center gap-3">
            <SessionSelector
              value={selectedSessionId}
              onChange={handleSessionChange}
              className=""
            />
            <button
              onClick={() => setShowAddModal(true)}
              disabled={selectedSessionId === null}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaPlus className="w-3.5 h-3.5" />
              Add Student
            </button>
          </div>
        </div>

        {/* No session warning */}
        {!sessionLoading && selectedSessionId === null && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <p className="text-amber-700 text-sm font-medium">No active academic session found. Please create and activate a session first.</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Students */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <FiUsers className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>

          {/* Male */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <FaMale className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Male</p>
              <p className="text-2xl font-bold text-gray-900">{stats.male}</p>
              <p className="text-xs text-gray-400">
                {stats.total > 0 ? ((stats.male / stats.total) * 100).toFixed(0) : 0}%
              </p>
            </div>
          </div>

          {/* Female */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-pink-50 flex items-center justify-center flex-shrink-0">
              <FaFemale className="w-4 h-4 text-pink-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Female</p>
              <p className="text-2xl font-bold text-gray-900">{stats.female}</p>
              <p className="text-xs text-gray-400">
                {stats.total > 0 ? ((stats.female / stats.total) * 100).toFixed(0) : 0}%
              </p>
            </div>
          </div>

          {/* Total Due */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
              <HiCurrencyRupee className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Due</p>
              <p className="text-xl font-bold text-gray-900">₹{stats.totalDue.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <FaSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name or admission number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Class Filter */}
              <select
                value={selectedClassId === null ? 'all' : selectedClassId.toString()}
                onChange={(e) => handleClassChange(e.target.value)}
                disabled={selectedSessionId === null}
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[130px] disabled:bg-gray-50 disabled:cursor-not-allowed text-gray-700"
              >
                <option value="all">All Classes</option>
                {classes.map((classItem) => (
                  <option key={classItem.id} value={classItem.id.toString()}>
                    {classItem.name}
                  </option>
                ))}
              </select>

              {/* Section Filter */}
              <select
                value={selectedSectionId === null ? 'all' : selectedSectionId.toString()}
                onChange={(e) => setSelectedSectionId(e.target.value === 'all' ? null : parseInt(e.target.value))}
                disabled={selectedClassId === null}
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[130px] disabled:bg-gray-50 disabled:cursor-not-allowed text-gray-700"
              >
                <option value="all">All Sections</option>
                {availableSections.map((section) => (
                  <option key={section.id} value={section.id.toString()}>
                    {section.name}
                  </option>
                ))}
              </select>

              {/* Active / Inactive Pill Tabs */}
              <div className="bg-gray-100 p-1 rounded-xl flex items-center gap-1">
                <button
                  onClick={() => setActiveFilter(true)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                    activeFilter
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setActiveFilter(false)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                    !activeFilter
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Inactive
                </button>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FiXCircle className="w-3.5 h-3.5" />
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Student List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <StudentList
            students={filteredStudents}
            loading={loading}
            selectedSessionId={selectedSessionId}
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
