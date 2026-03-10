import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaPlus, FaChevronRight, FaTimes } from 'react-icons/fa';
import { HiOutlinePencil, HiOutlineTrash, HiOutlineArrowLeft, HiOutlineCheck } from 'react-icons/hi';
import { chapterApi } from '../api';
import { Chapter } from '../types';
import { useAppContext } from '../../../providers/AppContext';

export default function ChaptersPage() {
  const { showToast } = useAppContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const subjectId = Number(searchParams.get('subjectId'));
  const subjectName = searchParams.get('subjectName') || 'Subject';

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [deletingChapter, setDeletingChapter] = useState<Chapter | null>(null);
  const [formName, setFormName] = useState('');
  const [formOrder, setFormOrder] = useState('1');

  const { data: chapters = [], isLoading } = useQuery<Chapter[]>(
    ['chapters', subjectId],
    () => chapterApi.list(subjectId),
    { enabled: !!subjectId }
  );

  const createMutation = useMutation(
    () => chapterApi.create({ subjectId, name: formName, orderNumber: Number(formOrder) }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['chapters', subjectId]);
        setShowAddModal(false);
        setFormName('');
        setFormOrder(String(chapters.length + 2));
        showToast({ message: 'Chapter created successfully', type: 'SUCCESS' });
      },
      onError: (e: unknown) => showToast({ message: (e as Error).message, type: 'ERROR' }),
    }
  );

  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: Partial<Omit<Chapter, 'taughtOn'> & { taughtOn?: string }> }) => chapterApi.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['chapters', subjectId]);
        setEditingChapter(null);
        setFormName('');
        showToast({ message: 'Chapter updated successfully', type: 'SUCCESS' });
      },
      onError: (e: unknown) => showToast({ message: (e as Error).message, type: 'ERROR' }),
    }
  );

  const deleteMutation = useMutation(
    (id: number) => chapterApi.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['chapters', subjectId]);
        setDeletingChapter(null);
        showToast({ message: 'Chapter deleted successfully', type: 'SUCCESS' });
      },
      onError: (e: unknown) => showToast({ message: (e as Error).message, type: 'ERROR' }),
    }
  );

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    if (editingChapter) {
      updateMutation.mutate({ id: editingChapter.id, data: { name: formName, orderNumber: Number(formOrder) } });
    } else {
      createMutation.mutate();
    }
  };

  const handleToggleTaught = (chapter: Chapter) => {
    updateMutation.mutate({
      id: chapter.id,
      data: { isTaught: !chapter.isTaught, taughtOn: !chapter.isTaught ? new Date().toISOString().split('T')[0] : undefined },
    });
  };

  const taughtCount = chapters.filter(c => c.isTaught).length;

  if (!subjectId) {
    return (
      <div className="p-4 md:p-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500 mb-3">No subject selected.</p>
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
                <span className="text-gray-600 font-medium">{subjectName}</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Chapters</h1>
              <p className="text-sm text-gray-500 mt-0.5">Manage chapters and track teaching progress</p>
            </div>
          </div>
          <button
            onClick={() => { setShowAddModal(true); setFormName(''); setFormOrder(String(chapters.length + 1)); }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition whitespace-nowrap"
          >
            <FaPlus size={11} />
            Add Chapter
          </button>
        </div>

        {/* Stats */}
        {!isLoading && chapters.length > 0 && (
          <div className="grid grid-cols-3 gap-4 max-w-sm">
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-xs text-gray-500 font-medium">Total</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{chapters.length}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-xs text-gray-500 font-medium">Taught</p>
              <p className="text-xl font-bold text-green-600 mt-0.5">{taughtCount}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-xs text-gray-500 font-medium">Remaining</p>
              <p className="text-xl font-bold text-amber-500 mt-0.5">{chapters.length - taughtCount}</p>
            </div>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : chapters.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <FaPlus className="text-blue-300" size={18} />
            </div>
            <p className="text-gray-700 font-semibold">No chapters yet</p>
            <p className="text-gray-400 text-sm mt-1">Add the first chapter for {subjectName}</p>
            <button
              onClick={() => { setShowAddModal(true); setFormName(''); setFormOrder('1'); }}
              className="mt-5 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              <FaPlus size={11} />
              Add First Chapter
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <ul className="divide-y divide-gray-100">
              {chapters.map(chapter => (
                <li key={chapter.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 group transition">
                  {/* Order badge */}
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                    {chapter.orderNumber}
                  </div>

                  {/* Name — clickable to exams */}
                  <button
                    onClick={() => navigate(`/dashboard/academics/exams?chapterId=${chapter.id}&chapterName=${encodeURIComponent(chapter.name)}&subjectName=${encodeURIComponent(subjectName)}`)}
                    className="flex-1 text-left flex items-center gap-2 font-medium text-gray-800 hover:text-blue-600 transition text-sm"
                  >
                    {chapter.name}
                    <FaChevronRight className="text-gray-300 group-hover:text-blue-400 text-xs transition" />
                  </button>

                  {/* Taught toggle */}
                  <button
                    onClick={() => handleToggleTaught(chapter)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition shrink-0 ${
                      chapter.isTaught
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {chapter.isTaught && <HiOutlineCheck className="text-sm" />}
                    {chapter.isTaught ? 'Taught' : 'Not Taught'}
                  </button>

                  {/* Actions — hover reveal */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                    <button
                      onClick={() => { setEditingChapter(chapter); setFormName(chapter.name); setFormOrder(String(chapter.orderNumber)); }}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Edit"
                    >
                      <HiOutlinePencil className="text-base" />
                    </button>
                    <button
                      onClick={() => setDeletingChapter(chapter)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete"
                    >
                      <HiOutlineTrash className="text-base" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {(showAddModal || editingChapter) && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingChapter ? 'Edit Chapter' : 'Add Chapter'}
              </h3>
              <button
                onClick={() => { setShowAddModal(false); setEditingChapter(null); }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <FaTimes size={15} />
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Chapter Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="e.g. Introduction to Algebra"
                  required
                  autoFocus
                  className="w-full border border-gray-300 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Order Number</label>
                <input
                  type="number"
                  min="1"
                  value={formOrder}
                  onChange={e => setFormOrder(e.target.value)}
                  required
                  className="w-full border border-gray-300 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setEditingChapter(null); }}
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
                    : editingChapter ? 'Save Changes' : 'Add Chapter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingChapter && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 text-center">
            <div className="text-4xl mb-3">🗑️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Chapter?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Deleting <span className="font-medium text-gray-700">"{deletingChapter.name}"</span> will also remove all its exams and marks. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingChapter(null)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deletingChapter.id)}
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
