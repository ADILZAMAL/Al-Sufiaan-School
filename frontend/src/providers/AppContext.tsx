import React, { useCallback, useContext, useMemo, useState } from "react";
import Toast from "../components/common/Toast";
import { useQuery } from "react-query";
import * as apiClient from "../features/auth/api";

type ToastMessage = {
  message: string;
  type: "SUCCESS" | "ERROR";
};

type AppContext = {
  showToast: (toastMessage: ToastMessage) => void;
  isLoggedIn: boolean;
  isAuthLoading: boolean;
  userRole: 'SUPER_ADMIN' | 'ADMIN' | 'CASHIER' | null;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
};

const AppContext = React.createContext<AppContext | undefined>(undefined);

export const AppContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [toast, setToast] = useState<ToastMessage | undefined>(undefined);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  const { data: userData, isLoading: isAuthLoading } = useQuery(
    "validateToken",
    apiClient.validateToken,
    {
      retry: false,
    }
  );

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const showToast = useCallback((toastMessage: ToastMessage) => {
    setToast(toastMessage);
  }, []);

  const isLoggedIn = !!userData?.data;
  const userRole = userData?.data?.role || null;

  const contextValue = useMemo(
    () => ({
      showToast,
      isLoggedIn,
      isAuthLoading,
      userRole,
      isSidebarOpen,
      toggleSidebar,
    }),
    [showToast, isLoggedIn, isAuthLoading, userRole, isSidebarOpen, toggleSidebar]
  );

  return (
    <AppContext.Provider value={contextValue}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(undefined)}
        />
      )}
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  return context as AppContext;
};
