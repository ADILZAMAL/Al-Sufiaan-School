import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { useForm } from "react-hook-form";
import * as apiClient from "../api";
import { ClassType, SectionType } from "../api";
import { useAppContext } from "../../../providers/AppContext";
import { FaPlus } from "react-icons/fa";

type AddClassFormData = {
  name: string;
};

type AddSectionFormData = {
  name: string;
};

const Class: React.FC = () => {
  const { showToast } = useAppContext();
  const queryClient = useQueryClient();
  const [activeClass, setActiveClass] = useState<ClassType | null>(null);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);

  const { data: classes, isLoading } = useQuery("fetchClasses", apiClient.fetchClasses);

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

  const classMutation = useMutation(apiClient.addClass, {
    onSuccess: () => {
      showToast({ message: "Class Added Successfully!", type: "SUCCESS" });
      resetClass();
      setIsClassModalOpen(false);
      queryClient.invalidateQueries("fetchClasses");
    },
    onError: (error: Error) => {
      showToast({ message: error.message, type: "ERROR" });
    },
  });

  const sectionMutation = useMutation(apiClient.addSection, {
    onSuccess: () => {
      showToast({ message: "Section Added Successfully!", type: "SUCCESS" });
      resetSection();
      setIsSectionModalOpen(false);
      queryClient.invalidateQueries("fetchClasses");
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
      setActiveClass(classes[0]);
    }
  }, [classes]);

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">
            Class Management
          </h2>
          <button
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 transition-all duration-200"
            onClick={() => setIsClassModalOpen(true)}
          >
            <FaPlus />
            Add Class
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="flex gap-4 mb-6">
            {classes?.map((classItem: ClassType) => (
              <button
                key={classItem.id}
                onClick={() => setActiveClass(classItem)}
                type="button"
                className={`px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                  activeClass?.id === classItem.id
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                }`}
              >
                {classItem.name}
              </button>
            ))}
          </div>
        )}

        {/* Render sections for the active class here */}
        {activeClass && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                Sections for {activeClass.name}
              </h3>
              <button
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-700 transition-all duration-200"
                onClick={() => setIsSectionModalOpen(true)}
              >
                <FaPlus />
                Add Section
              </button>
            </div>
            
            {activeClass.sections && activeClass.sections.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeClass.sections.map((section: SectionType) => (
                  <div key={section.id} className="bg-gray-50 p-4 rounded-lg border">
                    <h4 className="font-semibold text-gray-800">{section.name}</h4>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No sections found for this class.</p>
            )}
          </div>
        )}
      </div>

      {/* Add Class Modal */}
      {isClassModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md transform transition-all duration-300">
            <h3 className="text-xl font-semibold mb-6 text-gray-800">
              Add New Class
            </h3>
            <form onSubmit={onSubmitClass}>
              <div className="space-y-4">
                <input
                  type="text"
                  className="w-full border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Class Name"
                  {...registerClass("name", { required: "Class name is required" })}
                />
                {classErrors.name && (
                  <span className="text-red-500">{classErrors.name.message}</span>
                )}
              </div>
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 transition"
                  onClick={() => setIsClassModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                  disabled={classMutation.isLoading}
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
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md transform transition-all duration-300">
            <h3 className="text-xl font-semibold mb-6 text-gray-800">
              Add New Section to {activeClass?.name}
            </h3>
            <form onSubmit={onSubmitSection}>
              <div className="space-y-4">
                <input
                  type="text"
                  className="w-full border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Section Name"
                  {...registerSection("name", { required: "Section name is required" })}
                />
                {sectionErrors.name && (
                  <span className="text-red-500">{sectionErrors.name.message}</span>
                )}
              </div>
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 transition"
                  onClick={() => setIsSectionModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition"
                  disabled={sectionMutation.isLoading}
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
