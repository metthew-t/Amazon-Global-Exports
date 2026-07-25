import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback(({ title, description, type = 'default' }) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, description, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type === 'success' ? 'toast-success' : t.type === 'error' ? 'toast-error' : ''}`}>
            {t.type === 'success' ? <CheckCircle size={16} className="text-green-400 mt-0.5 shrink-0" /> : t.type === 'error' ? <XCircle size={16} className="text-red-400 mt-0.5 shrink-0" /> : null}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{t.title}</p>
              {t.description && <p className="text-xs text-gray-400 mt-0.5">{t.description}</p>}
            </div>
            <button onClick={() => remove(t.id)} className="text-gray-500 hover:text-white shrink-0"><X size={14} /></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
