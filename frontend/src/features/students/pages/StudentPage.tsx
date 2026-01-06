import React, { useState, useEffect } from 'react';
import { FaPlus, FaSearch, FaUserGraduate, FaFilter, FaDownload } from "react-icons/fa";
import { FiUsers, FiTrendingUp, FiUserCheck } from 'react-icons/fi';
import StudentList from '../components/StudentList';
import AddStudentModal from '../components/AddStudentModal';
import EditStudentModal from '../components/EditStudentModal';
import DeleteStudentModal from '../components/DeleteStudentModal';
import { Student, Gender } from '../types';
import { studentApi } from '../api';

const StudentPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await studentApi.getStudents();
      console.log("testing", response)
      setStudents(response || []);
    } catch (error) {
      console.error('Failed to fetch students:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleAddStudent = () => {
    setShowAddModal(true);
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setShowEditModal(true);
  };

  const handleDeleteStudent = (student: Student) => {
    setSelectedStudent(student);
    setShowDeleteModal(true);
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedStudent(null);
  };

  const handleSuccess = () => {
    handleModalClose();
    fetchStudents();
  };

  const filteredStudents = students.filter(student =>
    student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <div className="hidden md:flex items-center gap-4">
                <button className="bg-white/20 backdrop-blur text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors flex items-center gap-2">
                  <FaDownload />
                  Export
                </button>
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
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-lg">
              <FaSearch className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, admission number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <FaFilter className="text-gray-600 w-4 h-4" />
                <span className="hidden sm:inline text-sm font-medium">Filter</span>
              </button>
              
              <button
                onClick={handleAddStudent}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105 shadow-md"
              >
                <FaPlus className="w-4 h-4" />
                <span className="font-medium">Add Student</span>
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
