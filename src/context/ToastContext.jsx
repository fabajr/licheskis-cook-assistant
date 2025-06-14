import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const show = useCallback((message, duration = 3000) => {
    setToast(message);
    setTimeout(() => setToast(null), duration);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && (
        <div className="toast-container position-fixed p-3 toast-container-responsive">
          <div className="toast show">
            <div className="toast-body">{toast}</div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}
