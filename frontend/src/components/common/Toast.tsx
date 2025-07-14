import { useEffect } from "react";

type ToastProps = {
  message: string;
  type: "SUCCESS" | "ERROR";
  onClose: () => void;
};

import {
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";

const Toast = ({ message, type, onClose }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => {
      clearTimeout(timer);
    };
  }, [onClose]);

  const toastDetails = {
    SUCCESS: {
      icon: <FaCheckCircle className="text-green-500" size={24} />,
      style: "bg-green-100 border-green-500",
      title: "Success",
    },
    ERROR: {
      icon: <FaTimesCircle className="text-red-500" size={24} />,
      style: "bg-red-100 border-red-500",
      title: "Error",
    },
  };

  const { icon, style, title } = toastDetails[type];

  return (
    <div
      className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm w-full border-l-4 ${style}`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">{icon}</div>
        <div className="ml-3 w-0 flex-1 pt-0.5">
          <p className="text-sm font-medium text-gray-900">{title}</p>
          <p className="mt-1 text-sm text-gray-600">{message}</p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            onClick={onClose}
            className="inline-flex text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Close</span>
            <FaTimesCircle size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toast;
