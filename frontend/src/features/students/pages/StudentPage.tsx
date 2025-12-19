import React, { useState, useEffect } from 'react';
import {FaPlus, FaSearch} from "react-icons/fa"
import StudentList from '../components/StudentList';
// import AddStudentModal from '../components/AddStudentModal';
import EditStudentModal from '../components/EditStudentModal';
import DeleteStudentModal from '../components/DeleteStudentModal';
import { Student } from '../types';
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
      // Set empty array on error to prevent undefined issues
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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
        <p className="text-gray-600">Manage student records and information</p>
      </div>

      {/* Actions Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <FaSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAddStudent}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <FaPlus />
            Add Student
          </button>
        </div>
      </div>

      {/* Student List */}
      <StudentList
        students={filteredStudents}
        loading={loading}
        onEdit={handleEditStudent}
        onDelete={handleDeleteStudent}
      /> 

      {/* Modals */}
      {/* <AddStudentModal
        isOpen={showAddModal}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
      /> */}

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