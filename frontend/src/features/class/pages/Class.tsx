import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { useForm } from "react-hook-form";
import * as apiClient from "../api";
import { ClassType, SectionType } from "../api";
import { useAppContext } from "../../../providers/AppContext";
import { FaPlus, FaChalkboard, FaLayerGroup, FaTimes } from "react-icons/fa";
import SessionSelector from "../../sessions/components/SessionSelector";
import { academicSessionApi } from "../../sessions/api";
import { AcademicSession } from "../../sessions/types";

type AddClassFormData = { name: string };
type AddSectionFormData = { name: string };

const Class: React.FC = () => {
  const { showToast } = useAppContext();
  const queryClient = useQueryClient();
  const [activeClass, setActiveClass] = useState<ClassType | null>(null);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [manualSessionId, setManualSessionId] = useState<number | null>(null);

  const { data: activeSession } = useQuery<AcademicSession | null>(
    "activeSession",
    academicSessionApi.getActiveSession,
    { staleTime: 5 * 60 * 1000 }
  );

  const selectedSessionId = manualSessionId ?? activeSession?.id ?? null;

  const { data: classes, isLoading } = useQuery(
    ["fetchClasses", selectedSessionId],
    () => apiClient.fetchClasses(selectedSessionId ?? undefined),
    { enabled: selectedSessionId !== null }
  );

  const {
    register: registerClass,
    handleSubmit: handleSubmitClass,
    formState: { errors: classErrors },
    reset: resetClass,
  } = useForm<AddClassFormData>();

  const {
    register: registerSection,
    handleSubmit: handleSubmitSection,
    formState: { errors: sectionErrors },
    reset: resetSection,
  } = useForm<AddSectionFormData>();

  const classMutation = useMutation(
    (data: AddClassFormData) =>
      apiClient.addClass({ ...data, sessionId: selectedSessionId ?? undefined }),
    {
      onSuccess: () => {
        showToast({ message: "Class Added Successfully!", type: "SUCCESS" });
        resetClass();
        setIsClassModalOpen(false);
        queryClient.invalidateQueries(["fetchClasses", selectedSessionId]);
      },
      onError: (error: Error) => {
        showToast({ message: error.message, type: "ERROR" });
      },
    }
  );

  const sectionMutation = useMutation(apiClient.addSection, {
    onSuccess: () => {
      showToast({ message: "Section Added Successfully!", type: "SUCCESS" });
      resetSection();
      setIsSectionModalOpen(false);
      queryClient.invalidateQueries(["fetchClasses", selectedSessionId]);
    },
    onError: (error: Error) => {
      showToast({ message: error.message, type: "ERROR" });
    },
  });

  const onSubmitClass = handleSubmitClass((data) => {
    classMutation.mutate(data);
  });

  const onSubmitSection = handleSubmitSection((data) => {
    if (activeClass) {
      sectionMutation.mutate({ ...data, classId: activeClass.id });
    }
  });

  useEffect(() => {
    if (classes && classes.length > 0) {
      setActiveClass((prev) => {
        if (prev) {
          const updated = classes.find((c) => c.id === prev.id);
          return updated ?? classes[0];
        }
        return classes[0];
      });
    } else {
      setActiveClass(null);
    }
  }, [classes]);

  const handleSessionChange = (sessionId: number) => {
    setManualSessionId(sessionId);
    setActiveClass(null);
  };

  const totalSections =
    classes?.reduce((sum, c) => sum + (c.sections?.length ?? 0), 0) ?? 0;

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Class Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage classes and sections per academic session
            </p>
          </div>
          <div className="flex items-center gap-3">
            <SessionSelector
              value={selectedSessionId}
              onChange={handleSessionChange}
            />
            <button
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              onClick={() => setIsClassModalOpen(true)}
              disabled={selectedSessionId === null}
            >
              <FaPlus size={11} />
              Add Class
            </button>
          </div>
        </div>

        {/* Stats */}
        {selectedSessionId !== null && !isLoading && classes && (
          <div className="grid grid-cols-2 gap-4 max-w-sm">
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <FaChalkboard className="text-blue-600" size={14} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Classes</p>
                <p className="text-xl font-bold text-gray-900">{classes.length}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                <FaLayerGroup className="text-emerald-600" size={14} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Sections</p>
                <p className="text-xl font-bold text-gray-900">{totalSections}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {selectedSessionId === null ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
            <p className="text-amber-700 font-medium text-sm">
              No active session found. Please create and activate a session first.
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : classes && classes.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Class List */}
            <div className="lg:col-span-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Classes ({classes.length})
              </p>
              <div className="space-y-2">
                {classes.map((cls: ClassType) => (
                  <button
                    key={cls.id}
                    onClick={() => setActiveClass(cls)}
                    type="button"
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-150 ${
                      activeClass?.id === cls.id
                        ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200"
                        : "bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">{cls.name}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          activeClass?.id === cls.id
                            ? "bg-blue-500 text-blue-100"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {cls.sections?.length ?? 0}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Sections Panel */}
            <div className="lg:col-span-2">
              {activeClass ? (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden h-full">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{activeClass.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {activeClass.sections?.length ?? 0}{" "}
                        {(activeClass.sections?.length ?? 0) === 1 ? "section" : "sections"}
                      </p>
                    </div>
                    <button
                      onClick={() => setIsSectionModalOpen(true)}
                      className="flex items-center gap-2 bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition"
                    >
                      <FaPlus size={11} />
                      Add Section
                    </button>
                  </div>

                  {activeClass.sections && activeClass.sections.length > 0 ? (
                    <div className="p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {activeClass.sections.map((section: SectionType) => (
                        <div
                          key={section.id}
                          className="flex flex-col items-center justify-center gap-2 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition group"
                        >
                          <div className="w-10 h-10 rounded-xl bg-indigo-100 group-hover:bg-indigo-200 flex items-center justify-center text-indigo-600 font-bold text-base transition">
                            {section.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            Section {section.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-16 text-center">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                        <FaLayerGroup className="text-gray-300" size={18} />
                      </div>
                      <p className="text-gray-500 text-sm font-medium">No sections yet</p>
                      <p className="text-gray-400 text-xs mt-1">
                        Add a section to {activeClass.name} to get started
                      </p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <FaChalkboard className="text-blue-300" size={22} />
            </div>
            <p className="text-gray-700 font-semibold">No classes yet</p>
            <p className="text-gray-400 text-sm mt-1">
              Create your first class for this session
            </p>
            <button
              onClick={() => setIsClassModalOpen(true)}
              className="mt-5 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              <FaPlus size={11} />
              Add First Class
            </button>
          </div>
        )}
      </div>

      {/* Add Class Modal */}
      {isClassModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">Add New Class</h3>
              <button
                onClick={() => {
                  setIsClassModalOpen(false);
                  resetClass();
                }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <FaTimes size={15} />
              </button>
            </div>
            <form onSubmit={onSubmitClass} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Class Name
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. Class 1, Grade 5"
                  {...registerClass("name", { required: "Class name is required" })}
                />
                {classErrors.name && (
                  <p className="text-red-500 text-xs mt-1">{classErrors.name.message}</p>
                )}
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsClassModalOpen(false);
                    resetClass();
                  }}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={classMutation.isLoading}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {classMutation.isLoading ? "Adding..." : "Add Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Section Modal */}
      {isSectionModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Add New Section</h3>
                <p className="text-xs text-gray-400 mt-0.5">to {activeClass?.name}</p>
              </div>
              <button
                onClick={() => {
                  setIsSectionModalOpen(false);
                  resetSection();
                }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <FaTimes size={15} />
              </button>
            </div>
            <form onSubmit={onSubmitSection} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Section Name
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="e.g. A, B, C"
                  {...registerSection("name", { required: "Section name is required" })}
                />
                {sectionErrors.name && (
                  <p className="text-red-500 text-xs mt-1">{sectionErrors.name.message}</p>
                )}
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsSectionModalOpen(false);
                    resetSection();
                  }}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sectionMutation.isLoading}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition"
                >
                  {sectionMutation.isLoading ? "Adding..." : "Add Section"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Class;
