import React, { useEffect, useState } from "react";
import { useQuery } from "react-query";
import * as apiClient from "../api/api-client";
import { FaPlus } from "react-icons/fa";

const Class: React.FC = () => {
  const { data: classes, isLoading } = useQuery("fetchClasses", () =>
    apiClient.fetchClasses()
  );
  const [activeClass, setActiveClass] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
            onClick={() => setIsModalOpen(true)}
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
            {classes?.map((x: any) => (
              <button
                key={x._id}
                onClick={() => setActiveClass(x)}
                type="button"
                className={`px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                  activeClass?._id === x._id
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                }`}
              >
                {x.name}
              </button>
            ))}
          </div>
        )}

        {/* Render sections for the active class here */}
        {activeClass && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Sections for {activeClass.name}
            </h3>
            {/* Placeholder for sections */}
            <p className="text-gray-600">
              Sections for this class will be displayed here.
            </p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md transform transition-all duration-300">
            <h3 className="text-xl font-semibold mb-6 text-gray-800">
              Add New Class
            </h3>
            {/* Add class form goes here */}
            <div className="flex justify-end space-x-4 mt-6">
              <button
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 transition"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                // onClick={handleAddClass}
              >
                Add Class
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Class;
