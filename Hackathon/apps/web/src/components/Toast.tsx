export interface ToastType {
  id: string;
  message: string;
  type: 'success' | 'error';
}

interface ToastContainerProps {
  toasts: ToastType[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 w-80">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center justify-between p-4 rounded-xl border shadow-2xl transition-all duration-300 transform translate-x-0 ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/30 shadow-emerald-950/20'
              : 'bg-rose-950/90 text-rose-300 border-rose-500/30 shadow-rose-950/20'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{toast.type === 'success' ? '⚡' : '⚠️'}</span>
            <p className="text-sm font-semibold">{toast.message}</p>
          </div>
          <button
            onClick={() => onClose(toast.id)}
            className="text-gray-400 hover:text-white text-xs ml-4 focus:outline-none"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}