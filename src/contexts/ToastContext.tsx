import { createContext, useContext, useState, useCallback, useRef } from "react";
import { Toast, type ToastType } from "@/components/ui/Toast";

type ToastContextType = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ message: string; type: ToastType; key: number } | null>(null);
  const keyRef = useRef(0);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    keyRef.current += 1;
    setToast({ message, type, key: keyRef.current });
  }, []);

  const handleDismiss = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Toast
          key={toast.key}
          message={toast.message}
          type={toast.type}
          onDismiss={handleDismiss}
        />
      )}
    </ToastContext.Provider>
  );
}
