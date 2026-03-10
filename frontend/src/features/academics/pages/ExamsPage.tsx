import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaPlus, FaChevronRight, FaTimes } from 'react-icons/fa';
import { HiOutlinePencil, HiOutlineTrash, HiOutlineArrowLeft } from 'react-icons/hi';
import { examApi } from '../api';
import { Exam } from '../types';
import { useAppContext } from '../../../providers/AppContext';

export default function ExamsPage() {
  const { showToast } = useAppContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const chapterId = Number(searchParams.get('chapterId'));
  const chapterName = searchParams.get('chapterName') || 'Chapter';
  const subjectName = searchParams.get('subjectName') || 'Subject';

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [deletingExam, setDeletingExam] = useState<Exam | null>(null);

  const emptyForm = { name: '', totalMarks: '', passingMarks: '', examDate: '' };
  const [form, setForm] = useState(emptyForm);

  const { data: exams = [], isLoading } = useQuery<Exam[]>(
    ['exams', chapterId],
    () => examApi.list(chapterId),
    { enabled: !!chapterId }
  );

  const createMutation = useMutation(
    () => examApi.create({
      chapterId,
      name: form.name,
      totalMarks: Number(form.totalMarks),
      passingMarks: Number(form.passingMarks),
      examDate: form.examDate || undefined,
    }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['exams', chapterId]);
        setShowAddModal(false);
        setForm(emptyForm);
        showToast({ message: 'Exam created successfully', type: 'SUCCESS' });
      },
      onError: (e: Error) => showToast({ message: e.message, type: 'ERROR' }),
    }
  );

  const updateMutation = useMutation(
    ({ id }: { id: number }) => examApi.update(id, {
      name: form.name,
      totalMarks: Number(form.totalMarks),
      passingMarks: Number(form.passingMarks),
      examDate: form.examDate || undefined,
    }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['exams', chapterId]);
        setEditingExam(null);
        setForm(emptyForm);
        showToast({ message: 'Exam updated successfully', type: 'SUCCESS' });
      },
      onError: (e: Error) => showToast({ message: e.message, type: 'ERROR' }),
    }
  );

  const deleteMutation = useMutation(
    (id: number) => examApi.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['exams', chapterId]);
        setDeletingExam(null);
        showToast({ message: 'Exam deleted successfully', type: 'SUCCESS' });
      },
      onError: (e: Error) => showToast({ message: e.message, type: 'ERROR' }),
    }
  );

  const handleOpenEdit = (exam: Exam) => {
    setEditingExam(exam);
    setForm({
      name: exam.name,
      totalMarks: String(exam.totalMarks),
      passingMarks: String(exam.passingMarks),
      examDate: exam.examDate || '',
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(form.passingMarks) > Number(form.totalMarks)) {
      showToast({ message: 'Passing marks cannot exceed total marks', type: 'ERROR' });
      return;
    }
    if (editingExam) {
      updateMutation.mutate({ id: editingExam.id });
    } else {
      createMutation.mutate();
    }
  };

  const formatDate = (dateStr: string | null) =>
    dateStr ? new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

  if (!chapterId) {
    return (
      <div className="p-4 md:p-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500 mb-3">No chapter selected.</p>
          <button onClick={() => navigate('/dashboard/academics/subjects')} className="text-blue-600 hover:underline text-sm">
            Go back to Subjects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white border border-transparent hover:border-gray-200 rounded-lg transition"
            >
              <HiOutlineArrowLeft className="text-lg" />
            </button>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                <button
                  onClick={() => navigate('/dashboard/academics/subjects')}
                  className="hover:text-blue-600 transition font-medium"
                >
                  Subjects
                </button>
                <FaChevronRight className="text-gray-300" size={9} />
                <span className="font-medium">{subjectName}</span>
                <FaChevronRight className="text-gray-300" size={9} />
                <span className="text-gray-600 font-medium">{chapterName}</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Exams</h1>
              <p className="text-sm text-gray-500 mt-0.5">Manage exams for this chapter</p>
            </div>
          </div>
          <button
            onClick={() => { setShowAddModal(true); setForm(emptyForm); }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition whitespace-nowrap"
          >
            <FaPlus size={11} />
            Add Exam
          </button>
        </div>

        {/* Stats */}
        {!isLoading && exams.length > 0 && (
          <div className="grid grid-cols-2 gap-4 max-w-xs">
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-xs text-gray-500 font-medium">Total Exams</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{exams.length}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-xs text-gray-500 font-medium">Avg Pass Mark</p>
              <p className="text-xl font-bold text-blue-600 mt-0.5">
                {Math.round(exams.reduce((s, e) => s + Math.round((e.passingMarks / e.totalMarks) * 100), 0) / exams.length)}%
              </p>
            </div>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : exams.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <FaPlus className="text-blue-300" size={18} />
            </div>
            <p className="text-gray-700 font-semibold">No exams yet</p>
            <p className="text-gray-400 text-sm mt-1">Add the first exam for {chapterName}</p>
            <button
              onClick={() => { setShowAddModal(true); setForm(emptyForm); }}
              className="mt-5 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              <FaPlus size={11} />
              Add First Exam
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <ul className="divide-y divide-gray-100">
              {exams.map(exam => {
                const passPct = Math.round((exam.passingMarks / exam.totalMarks) * 100);
                const date = formatDate(exam.examDate);
                return (
                  <li key={exam.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 group transition">
                    {/* Exam name */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{exam.name}</p>
                      {date && <p className="text-xs text-gray-400 mt-0.5">{date}</p>}
                    </div>

                    {/* Marks info */}
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-center hidden sm:block">
                        <p className="text-xs text-gray-400">Total</p>
                        <p className="text-sm font-bold text-gray-800">{exam.totalMarks}</p>
                      </div>
                      <div className="text-center hidden sm:block">
                        <p className="text-xs text-gray-400">Passing</p>
                        <p className="text-sm font-bold text-gray-800">
                          {exam.passingMarks}
                          <span className="text-xs text-gray-400 font-normal ml-1">({passPct}%)</span>
                        </p>
                      </div>
                      <div className="sm:hidden text-xs text-gray-500 whitespace-nowrap">
                        {exam.passingMarks}/{exam.totalMarks}
                      </div>
                    </div>

                    {/* Actions — hover reveal */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                      <button
                        onClick={() => handleOpenEdit(exam)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit"
                      >
                        <HiOutlinePencil className="text-base" />
                      </button>
                      <button
                        onClick={() => setDeletingExam(exam)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete"
                      >
                        <HiOutlineTrash className="text-base" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {(showAddModal || editingExam) && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingExam ? 'Edit Exam' : 'Add Exam'}
              </h3>
              <button
                onClick={() => { setShowAddModal(false); setEditingExam(null); setForm(emptyForm); }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <FaTimes size={15} />
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Exam Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Test 1, Mid-Term, Quiz"
                  required
                  autoFocus
                  className="w-full border border-gray-300 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Total Marks</label>
                  <input
                    type="number"
                    min="1"
                    value={form.totalMarks}
                    onChange={e => setForm(f => ({ ...f, totalMarks: e.target.value }))}
                    required
                    className="w-full border border-gray-300 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Passing Marks</label>
                  <input
                    type="number"
                    min="1"
                    value={form.passingMarks}
                    onChange={e => setForm(f => ({ ...f, passingMarks: e.target.value }))}
                    required
                    className="w-full border border-gray-300 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Exam Date <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="date"
                  value={form.examDate}
                  onChange={e => setForm(f => ({ ...f, examDate: e.target.value }))}
                  className="w-full border border-gray-300 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setEditingExam(null); setForm(emptyForm); }}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {createMutation.isLoading || updateMutation.isLoading
                    ? 'Saving...'
                    : editingExam ? 'Save Changes' : 'Add Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingExam && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 text-center">
            <div className="text-4xl mb-3">🗑️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Exam?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Deleting <span className="font-medium text-gray-700">"{deletingExam.name}"</span> will also remove all student marks. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingExam(null)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deletingExam.id)}
                disabled={deleteMutation.isLoading}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition"
              >
                {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
